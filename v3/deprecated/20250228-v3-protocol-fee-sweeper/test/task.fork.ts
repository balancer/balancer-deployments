import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate } from '@src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProtocolFeeSweeperDeployment } from '../input';
import { MAX_UINT256, ZERO_ADDRESS } from '@helpers/constants';

describeForkTest.skip('ProtocolFeeSweeper', 'mainnet', 21917206, function () {
  const TASK_NAME = '20250228-v3-protocol-fee-sweeper';
  const CONTRACT_NAME = 'ProtocolFeeSweeper';

  // mainnet, since this is a mainnet fork test.
  const COW_SWAP_FEE_BURNER = '0xC0fC3dDfec95ca45A0D2393F518D3EA1ccF44f8b';
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const waEthUSDC = '0xd4fa2d31b7968e448877f69a96de69f5de8cd23e';
  const POOL = '0x85b2b559bc2d21104c4defdd6efca8a20343361d';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const USDC_HOLDER = '0x55FE002aefF02F77364de339a1292923A15844B8';

  let task: Task;
  let feeController: Contract;
  let feeSweeper: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let authorizer: Contract;
  let usdcToken: Contract;
  let input: ProtocolFeeSweeperDeployment;
  let feeRecipient: SignerWithAddress;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    feeSweeper = await task.deployedInstance(CONTRACT_NAME);

    input = task.input() as ProtocolFeeSweeperDeployment;

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const vaultAsExtension = vaultExtension.attach(vault.address);
    const controllerAddress = await vaultAsExtension.getProtocolFeeController();
    feeController = await vaultTask.instanceAt('ProtocolFeeController', controllerAddress);

    feeRecipient = await impersonate(input.FeeRecipient, fp(100));

    usdcToken = await task.instanceAt('IERC20', USDC);
  });

  before('grant withdrawal permission', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the sweeper permission to withdraw fees.
    await authorizer
      .connect(govMultisig)
      .grantRole(
        await feeController.getActionId(feeController.interface.getSighash('withdrawProtocolFeesForToken')),
        feeSweeper.address
      );
  });

  it('returns default parameters', async () => {
    expect(await feeSweeper.getVault()).to.eq(input.Vault);
    expect(await feeSweeper.getFeeRecipient()).to.eq(input.FeeRecipient);
  });

  it('sets target token', async () => {
    await feeSweeper.connect(feeRecipient).setTargetToken(USDC);

    expect(await feeSweeper.getTargetToken()).to.eq(USDC);
  });

  it('can set/remove burners', async () => {
    expect(await feeSweeper.isApprovedProtocolFeeBurner(COW_SWAP_FEE_BURNER)).to.be.false;

    await feeSweeper.connect(feeRecipient).addProtocolFeeBurner(COW_SWAP_FEE_BURNER);
    expect(await feeSweeper.isApprovedProtocolFeeBurner(COW_SWAP_FEE_BURNER)).to.be.true;

    await feeSweeper.connect(feeRecipient).removeProtocolFeeBurner(COW_SWAP_FEE_BURNER);
    expect(await feeSweeper.isApprovedProtocolFeeBurner(COW_SWAP_FEE_BURNER)).to.be.false;
  });

  it('can call the sweep function', async () => {
    await feeSweeper.connect(feeRecipient).sweepProtocolFeesForToken(POOL, waEthUSDC, 0, MAX_UINT256, ZERO_ADDRESS);
  });

  it('can recover protocol fees', async () => {
    const whale = await impersonate(USDC_HOLDER, fp(100));
    const USDC_AMOUNT = 1000e6;

    await usdcToken.connect(whale).transfer(feeSweeper.address, USDC_AMOUNT);

    const balanceBefore = await usdcToken.balanceOf(feeRecipient.address);
    await feeSweeper.connect(feeRecipient).recoverProtocolFees([USDC]);
    const balanceAfter = await usdcToken.balanceOf(feeRecipient.address);

    expect(balanceAfter - balanceBefore).to.eq(USDC_AMOUNT);
  });
});
