import hre from 'hardhat';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { BigNumberish, bn } from '@helpers/numbers';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode, getSigner } from '@src';
import { MAX_UINT256 } from '@helpers/constants';

describeForkTest.skip('ERC4626Wrapping', 'mainnet', 18412883, function () {
  let task: Task;
  let relayer: Contract, library: Contract;
  let vault: Contract, authorizer: Contract;
  let authorizerWithAdaptorValidation: Contract;

  const USDM = '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C';
  const USDM_HOLDER = '0xeF9A3cE48678D7e42296166865736899C3638B0E';
  const wUSDM = '0x57F5E098CaD7A3D1Eed53991D4d66C45C9AF7812';

  let usdmToken: Contract, wusdmToken: Contract;
  let sender: SignerWithAddress, recipient: SignerWithAddress;
  let chainedReference: BigNumber;
  const amountToWrap = bn(1e18);

  before('run task', async () => {
    task = new Task('20230314-batch-relayer-v5', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    library = await task.deployedInstance('BatchRelayerLibrary');
    relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
  });

  before('load vault and tokens', async () => {
    const vaultTask = new Task('20210418-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const authorizerAdaptorTask = new Task('20230414-authorizer-wrapper', TaskMode.TEST, getForkedNetwork(hre));

    vault = await vaultTask.instanceAt('Vault', await library.getVault());
    authorizerWithAdaptorValidation = await authorizerAdaptorTask.instanceAt(
      'AuthorizerWithAdaptorValidation',
      await vault.getAuthorizer()
    );

    authorizer = await vaultTask.instanceAt('Authorizer', await authorizerWithAdaptorValidation.getActualAuthorizer());
  });

  before('approve relayer at the authorizer', async () => {
    const relayerActionIds = await Promise.all(
      ['swap', 'batchSwap', 'joinPool', 'exitPool', 'setRelayerApproval', 'manageUserBalance'].map((action) =>
        vault.getActionId(vault.interface.getSighash(action))
      )
    );

    // We impersonate an account with the default admin role in order to be able to approve the relayer. This assumes
    // such an account exists.
    const admin = await impersonate(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));

    // Grant relayer permission to call all relayer functions
    await authorizer.connect(admin).grantRoles(relayerActionIds, relayer.address);
  });

  before(async () => {
    usdmToken = await task.instanceAt('IERC20', USDM);
    wusdmToken = await task.instanceAt('IERC4626', wUSDM);
    sender = await impersonate(USDM_HOLDER);
    recipient = await getSigner();

    await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
    await vault.connect(recipient).setRelayerApproval(recipient.address, relayer.address, true);
  });

  it('should wrap successfully', async () => {
    const balanceOfUSDMBefore = await usdmToken.balanceOf(sender.address);
    const balanceOfwUSDMBefore = await wusdmToken.balanceOf(recipient.address);
    const expectedBalanceOfwUSDMAfter = await wusdmToken.convertToShares(amountToWrap);

    expect(balanceOfwUSDMBefore).to.be.equal(0);

    // Approving vault to pull tokens from user.
    await usdmToken.connect(sender).approve(vault.address, amountToWrap);

    chainedReference = toChainedReference(30);
    const depositIntoUSDM = library.interface.encodeFunctionData('wrapERC4626', [
      wUSDM,
      sender.address,
      recipient.address,
      amountToWrap,
      chainedReference,
    ]);

    await relayer.connect(sender).multicall([depositIntoUSDM]);

    const balanceOfUSDMAfter = await usdmToken.balanceOf(sender.address);
    const balanceOfwUSDMAfter = await wusdmToken.balanceOf(recipient.address);

    expect(balanceOfUSDMBefore.sub(balanceOfUSDMAfter)).to.be.almostEqual(amountToWrap);
    expect(balanceOfwUSDMAfter).to.be.almostEqual(expectedBalanceOfwUSDMAfter, 0.01);
  });

  it('should unwrap successfully', async () => {
    const YearnAmountToWithdraw = await wusdmToken.convertToShares(amountToWrap);

    const balanceOfUSDCBefore = await usdmToken.balanceOf(sender.address);
    const balanceOfYearnBefore = await wusdmToken.balanceOf(recipient.address);

    expect(balanceOfYearnBefore).to.be.almostEqual(YearnAmountToWithdraw);

    const withdrawFromYearn = library.interface.encodeFunctionData('unwrapERC4626', [
      wUSDM,
      recipient.address,
      sender.address,
      chainedReference,
      0,
    ]);

    await wusdmToken.connect(recipient).approve(vault.address, MAX_UINT256);

    await relayer.connect(recipient).multicall([withdrawFromYearn]);

    const balanceOfUSDCAfter = await usdmToken.balanceOf(sender.address);
    const balanceOfYearnAfter = await wusdmToken.balanceOf(recipient.address);

    expect(balanceOfYearnAfter).to.be.equal(0);
    expect(balanceOfUSDCAfter.sub(balanceOfUSDCBefore)).to.be.almostEqual(amountToWrap, 0.01);
  });
});

function toChainedReference(key: BigNumberish): BigNumber {
  const CHAINED_REFERENCE_PREFIX = 'ba10';
  // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
  const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;

  return BigNumber.from(paddedPrefix).add(key);
}
