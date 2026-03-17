import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { takeSnapshot, SnapshotRestorer } from '@nomicfoundation/hardhat-network-helpers';

import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';
import { MAX_UINT48 } from '@helpers/constants';
import { actionId } from '@helpers/models/misc/actions';

describeForkTest('VaultExplorer-V2', 'mainnet', 22192500, function () {
  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const USDC_WHALE = '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c';

  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const waUSDC_ADDRESS = '0x73edDFa87C71ADdC275c2b9890f5c3a8480bC9E6';

  let task: Task;
  let vault: Contract;
  let authorizer: Contract;
  let vaultExtension: Contract;
  let vaultAdmin: Contract;
  let bufferRouter: Contract;
  let mockPool: Contract;
  let explorer: Contract;
  let permit2: Contract;
  let usdc: Contract;
  let usdcWhale: SignerWithAddress;
  let govMultisig: SignerWithAddress;
  let admin: SignerWithAddress;

  let extensionEntrypoint: Contract;
  let adminEntrypoint: Contract;

  let snapshot: SnapshotRestorer;
  let BAL: string;
  let WETH: string;

  before('run task', async () => {
    task = new Task('20250407-v3-vault-explorer-v2', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    explorer = await task.deployedInstance('VaultExplorer');
  });

  before('setup contracts and parameters', async () => {
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    mockPool = await poolTask.instanceAt('WeightedPool', poolTask.output()['MockWeightedPool']);

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');
    vaultAdmin = await vaultTask.deployedInstance('VaultAdmin');

    extensionEntrypoint = vaultExtension.attach(vault.target.toString()) as Contract;
    adminEntrypoint = vaultAdmin.attach(vault.target.toString()) as Contract;

    const routerTask = new Task('20241205-v3-buffer-router', TaskMode.READ_ONLY, getForkedNetwork(hre));
    bufferRouter = await routerTask.deployedInstance('BufferRouter');

    const permit2Task = new Task('00000000-permit2', TaskMode.READ_ONLY);
    const permit2Address = permit2Task.output({ network: 'mainnet' }).Permit2;
    permit2 = await routerTask.instanceAt('IPermit2', permit2Address);

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    usdc = await testBALTokenTask.instanceAt('TestBalancerToken', USDC_ADDRESS);

    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY, getForkedNetwork(hre));
    BAL = tokensTask.output().BAL.toLowerCase();
    WETH = tokensTask.output().WETH.toLowerCase();
  });

  before('setup accounts and permissions', async () => {
    admin = await getSigner(0);

    govMultisig = await impersonate(GOV_MULTISIG, fp(100));
    usdcWhale = await impersonate(USDC_WHALE, fp(10));

    await (authorizer.connect(govMultisig) as Contract).grantRole(await actionId(vaultAdmin, 'pausePool'), admin.address);
    await (authorizer.connect(govMultisig) as Contract).grantRole(await actionId(vaultAdmin, 'pauseVault'), admin.address);
  });

  it('checks contract addresses', async () => {
    expect(await explorer.getVault()).eq(vault.target.toString());

    const extensionAddress = await explorer.getVaultExtension();
    expect(extensionAddress).to.eq(vaultExtension.target.toString());

    expect(await vaultExtension.getVaultAdmin()).to.eq(await explorer.getVaultAdmin());
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await mockPool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq([BAL, WETH]);

    const explorerPoolTokens = (await explorer.getPoolTokens(mockPool.target.toString())).map((token: string) =>
      token.toLowerCase()
    );
    expect(explorerPoolTokens).to.be.deep.equal(poolTokens);
  });

  it('has new buffer functions', async () => {
    const initBalance = 1000000e6;
    await (usdc.connect(usdcWhale) as Contract).approve(permit2.target.toString(), initBalance);
    await (permit2.connect(usdcWhale) as Contract).approve(USDC_ADDRESS, bufferRouter.target.toString(), initBalance, MAX_UINT48);

    await (bufferRouter.connect(usdcWhale) as Contract).initializeBuffer(waUSDC_ADDRESS, initBalance, 0, 0);

    expect(await extensionEntrypoint.isERC4626BufferInitialized(waUSDC_ADDRESS)).to.be.true;
    expect(await extensionEntrypoint.getERC4626BufferAsset(waUSDC_ADDRESS)).to.be.eq(USDC_ADDRESS);

    // Two buffer asset functions.
    expect(await explorer.getERC4626BufferAsset(waUSDC_ADDRESS)).to.equal(USDC_ADDRESS);
    expect(await explorer.getBufferAsset(waUSDC_ADDRESS)).to.equal(USDC_ADDRESS);
  });

  it('can enable recovery mode when pool paused', async () => {
    snapshot = await takeSnapshot();

    await (adminEntrypoint.connect(admin) as Contract).pausePool(mockPool.target.toString());

    // Ensure paused and not in recovery mode.
    expect(await extensionEntrypoint.isPoolPaused(mockPool.target.toString())).to.be.true;
    expect(await extensionEntrypoint.isPoolInRecoveryMode(mockPool.target.toString())).to.be.false;

    await explorer.enableRecoveryMode(mockPool.target.toString());
    expect(await extensionEntrypoint.isPoolInRecoveryMode(mockPool.target.toString())).to.be.true;

    // Restore previous state so that the pool is unpaused and out of recovery mode.
    await snapshot.restore();
  });

  it('can enable recovery mode when Vault paused', async () => {
    await (adminEntrypoint.connect(admin) as Contract).pauseVault();

    // Ensure paused and not in recovery mode.
    expect(await adminEntrypoint.isVaultPaused()).to.be.true;
    expect(await extensionEntrypoint.isPoolInRecoveryMode(mockPool.target.toString())).to.be.false;

    await explorer.enableRecoveryMode(mockPool.target.toString());
    expect(await extensionEntrypoint.isPoolInRecoveryMode(mockPool.target.toString())).to.be.true;
  });
});
