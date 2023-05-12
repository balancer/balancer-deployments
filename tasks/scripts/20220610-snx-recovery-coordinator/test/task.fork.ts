import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { defaultAbiCoder } from '@ethersproject/abi';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { impersonate } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { expectTransferEvent } from '@helpers/expectTransfer';
import { WeightedPoolEncoder } from '@helpers/models/pools/weighted/encoder';

describeForkTest('SNXRecoveryCoordinator', 'mainnet', 14945041, function () {
  let govMultisig: SignerWithAddress;
  let coordinator: Contract;

  let vault: Contract;
  let authorizer: Contract;

  let allowlistTokenRole: string, withdrawCollectedFeesRole: string;

  let task: Task;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const wBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
  const renBTC = '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d';
  const sBTC = '0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6';

  const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const SNX = '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F';

  const SNX_AMOUNT = '937727163854831767449517';
  const sBTC_AMOUNT = '273030307592426881329';

  const BTC_STABLE_POOL_ID = '0xfeadd389a5c427952d8fdb8057d6c8ba1156cc56000000000000000000000066';
  const BTC_STABLE_POOL_ADDRESS = '0xFeadd389a5c427952D8fdb8057D6C8ba1156cC56';
  const BTC_STABLE_POOL_WHALE = '0x57d40ff4cf7441a04a05628911f57bb940b6c238';

  const SNX_WEIGHTED_POOL_ID = '0x072f14b85add63488ddad88f855fda4a99d6ac9b000200000000000000000027';
  const SNX_WEIGHTED_POOL_ADDRESS = '0x072f14B85ADd63488DDaD88f855Fda4A99d6aC9B';
  const SNX_WEIGHTED_POOL_WHALE = '0x605eA53472A496c3d483869Fe8F355c12E861e19';

  const SYNTHETIX_INSUFFICIENT_BALANCE = 'Insufficient balance after any settlement owing';

  before('run task', async () => {
    task = new Task('20220610-snx-recovery-coordinator', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    coordinator = await task.deployedInstance('SNXRecoveryCoordinator');
  });

  before('setup contracts', async () => {
    const vaultTask = new Task('20210418-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    authorizer = await vaultTask.instanceAt('Authorizer', await vault.getAuthorizer());
  });

  before('grant permissions', async () => {
    govMultisig = await impersonate(GOV_MULTISIG);

    const protocolFeeWithdrawerTask = new Task(
      '20220517-protocol-fee-withdrawer',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    const protocolFeeWithdrawer = await protocolFeeWithdrawerTask.deployedInstance('ProtocolFeesWithdrawer');

    // Gov approval for relayer
    allowlistTokenRole = await actionId(protocolFeeWithdrawer, 'allowlistToken');
    withdrawCollectedFeesRole = await actionId(protocolFeeWithdrawer, 'withdrawCollectedFees');
    await authorizer
      .connect(govMultisig)
      .grantRoles([allowlistTokenRole, withdrawCollectedFeesRole], coordinator.address);
  });

  // Before coordinator execution

  it('reverts on large exits from the sBTC pool', async () => {
    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const poolContract = await testBALTokenTask.instanceAt('TestBalancerToken', BTC_STABLE_POOL_ADDRESS);
    const EXACT_BPT_IN_FOR_TOKENS_OUT = 1;

    const whale = await impersonate(BTC_STABLE_POOL_WHALE);
    await expect(
      vault.connect(whale).exitPool(BTC_STABLE_POOL_ID, BTC_STABLE_POOL_WHALE, BTC_STABLE_POOL_WHALE, {
        assets: [wBTC, renBTC, sBTC],
        minAmountsOut: [0, 0, 0],
        // The helper used to encode user data has been removed; this is how it was encoded in the original fork test.
        userData: defaultAbiCoder.encode(
          ['uint256', 'uint256'],
          [EXACT_BPT_IN_FOR_TOKENS_OUT, await poolContract.balanceOf(BTC_STABLE_POOL_WHALE)]
        ),
        toInternalBalance: false,
      })
    ).to.be.revertedWith(SYNTHETIX_INSUFFICIENT_BALANCE);
  });

  it('reverts on large exits from the SNX pool', async () => {
    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const poolContract = await testBALTokenTask.instanceAt('TestBalancerToken', SNX_WEIGHTED_POOL_ADDRESS);

    const whale = await impersonate(SNX_WEIGHTED_POOL_WHALE);
    await expect(
      vault.connect(whale).exitPool(SNX_WEIGHTED_POOL_ID, SNX_WEIGHTED_POOL_WHALE, SNX_WEIGHTED_POOL_WHALE, {
        assets: [SNX, WETH],
        minAmountsOut: [0, 0],
        userData: WeightedPoolEncoder.exitExactBPTInForTokensOut(await poolContract.balanceOf(SNX_WEIGHTED_POOL_WHALE)),
        toInternalBalance: false,
      })
    ).to.be.revertedWith('SafeMath: subtraction overflow');
  });

  // Coordinator execution

  it('transfers tokens to the vault', async () => {
    const tx = await coordinator.performNextStage();

    expectTransferEvent(
      await tx.wait(),
      { from: await vault.getProtocolFeesCollector(), to: vault.address, value: SNX_AMOUNT },
      SNX
    );

    expectTransferEvent(
      await tx.wait(),
      { from: await vault.getProtocolFeesCollector(), to: vault.address, value: sBTC_AMOUNT },
      sBTC
    );
  });

  it('renounces its permissions to allowlist tokens on the ProtocolFeesWithdrawer', async () => {
    expect(await authorizer.hasRole(allowlistTokenRole, coordinator.address)).to.be.false;
  });

  it('renounces its permissions to withdraw tokens through the ProtocolFeesWithdrawer', async () => {
    expect(await authorizer.hasRole(withdrawCollectedFeesRole, coordinator.address)).to.be.false;
  });

  it('fails on future attempts to send tokens to Vault', async () => {
    await expect(coordinator.performNextStage()).to.be.revertedWith('All stages completed');
  });

  // After coordinator execution

  it('allows large exits from the sBTC pool', async () => {
    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const poolContract = await testBALTokenTask.instanceAt('TestBalancerToken', BTC_STABLE_POOL_ADDRESS);
    const EXACT_BPT_IN_FOR_TOKENS_OUT = 1;

    const whale = await impersonate(BTC_STABLE_POOL_WHALE);
    await vault.connect(whale).exitPool(BTC_STABLE_POOL_ID, BTC_STABLE_POOL_WHALE, BTC_STABLE_POOL_WHALE, {
      assets: [wBTC, renBTC, sBTC],
      minAmountsOut: [0, 0, 0],
      // The helper used to encode user data has been removed; this is how it was encoded in the original fork test.
      userData: defaultAbiCoder.encode(
        ['uint256', 'uint256'],
        [EXACT_BPT_IN_FOR_TOKENS_OUT, await poolContract.balanceOf(BTC_STABLE_POOL_WHALE)]
      ),
      toInternalBalance: false,
    });
  });

  it('allows large exits from the SNX pool', async () => {
    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const poolContract = await testBALTokenTask.instanceAt('TestBalancerToken', SNX_WEIGHTED_POOL_ADDRESS);

    const whale = await impersonate(SNX_WEIGHTED_POOL_WHALE);
    await vault.connect(whale).exitPool(SNX_WEIGHTED_POOL_ID, SNX_WEIGHTED_POOL_WHALE, SNX_WEIGHTED_POOL_WHALE, {
      assets: [SNX, WETH],
      minAmountsOut: [0, 0],
      userData: WeightedPoolEncoder.exitExactBPTInForTokensOut(await poolContract.balanceOf(SNX_WEIGHTED_POOL_WHALE)),
      toInternalBalance: false,
    });
  });
});
