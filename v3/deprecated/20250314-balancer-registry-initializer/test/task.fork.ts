import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { fp } from '@helpers/numbers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { impersonate } from '@src';
import { actionId } from '@helpers/models/misc/actions';

describeForkTest.only('BalancerContractRegistryInitializer', 'mainnet', 21862412, function () {
  let govMultisig: SignerWithAddress;
  let registryInitializer: Contract;
  let registry: Contract;

  let authorizer: Contract;
  let router: Contract;
  let batchRouter: Contract;
  let bufferRouter: Contract;
  let compositeLiquidityRouter: Contract;
  let weightedPoolFactory: Contract;
  let stablePoolFactory: Contract;
  let stableSurgePoolFactory: Contract;
  let lbpFactory: Contract;

  let task: Task;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  enum ContractType {
    OTHER, // a blank entry will have a 0-value type, and it's safest to return this in that case
    POOL_FACTORY,
    ROUTER,
    HOOK,
    ERC4626,
  }

  before('run task', async () => {
    task = new Task('20250314-balancer-registry-initializer', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    registryInitializer = await task.deployedInstance('BalancerContractRegistryInitializer');
  });

  before('setup contracts', async () => {
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const registryTask = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY, getForkedNetwork(hre));
    registry = await registryTask.deployedInstance('BalancerContractRegistry');

    const routerTask = new Task('20250307-v3-router-v2', TaskMode.READ_ONLY, getForkedNetwork(hre));
    router = await routerTask.deployedInstance('Router');

    const batchRouterTask = new Task('20241205-v3-batch-router', TaskMode.READ_ONLY, getForkedNetwork(hre));
    batchRouter = await batchRouterTask.deployedInstance('BatchRouter');

    const bufferRouterTask = new Task('20241205-v3-buffer-router', TaskMode.READ_ONLY, getForkedNetwork(hre));
    bufferRouter = await bufferRouterTask.deployedInstance('BufferRouter');

    const clrTask = new Task('20250123-v3-composite-liquidity-router-v2', TaskMode.READ_ONLY, getForkedNetwork(hre));
    compositeLiquidityRouter = await clrTask.deployedInstance('CompositeLiquidityRouter');

    const weightedPoolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    weightedPoolFactory = await weightedPoolTask.deployedInstance('WeightedPoolFactory');

    const stablePoolTask = new Task('20241205-v3-stable-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    stablePoolFactory = await stablePoolTask.deployedInstance('StablePoolFactory');

    const stableSurgePoolTask = new Task('20250121-v3-stable-surge', TaskMode.READ_ONLY, getForkedNetwork(hre));
    stableSurgePoolFactory = await stableSurgePoolTask.deployedInstance('StableSurgePoolFactory');

    const lbpFactoryTask = new Task(
      '20250307-v3-liquidity-bootstrapping-pool',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    lbpFactory = await lbpFactoryTask.deployedInstance('LBPoolFactory');
  });

  before('grant permissions', async () => {
    govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    await authorizer
      .connect(govMultisig)
      .grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), registryInitializer.target.toString());
  });

  it('is initializing the correct registry', async () => {
    expect(await registryInitializer.balancerContractRegistry()).to.eq(registry.target.toString());
  });

  it('perform registry initialization', async () => {
    await registryInitializer.initializeBalancerContractRegistry();
  });

  it('cannot initialize twice', async () => {
    await expect(registryInitializer.initializeBalancerContractRegistry()).to.be.reverted;
  });

  it('does not hold permission to register contracts', async () => {
    const permission = await actionId(registry, 'registerBalancerContract');
    expect(await authorizer.hasRole(permission, registryInitializer.target.toString())).to.be.false;
  });

  it('does not hold permission to add aliases', async () => {
    const permission = await actionId(registry, 'addOrUpdateBalancerContractAlias');
    expect(await authorizer.hasRole(permission, registryInitializer.target.toString())).to.be.false;
  });

  it('renounces the admin role', async () => {
    expect(await authorizer.hasRole(await authorizer.DEFAULT_ADMIN_ROLE(), registryInitializer.target.toString())).to.be
      .false;
  });

  it('has registered the routers', async () => {
    expect(await registry.isTrustedRouter(router.target.toString())).to.be.true;
    expect(await registry.isTrustedRouter(batchRouter.target.toString())).to.be.true;
    expect(await registry.isTrustedRouter(bufferRouter.target.toString())).to.be.true;
    expect(await registry.isTrustedRouter(compositeLiquidityRouter.target.toString())).to.be.true;
  });

  it('has registered the pool factories', async () => {
    let info = await registry.getBalancerContractInfo(weightedPoolFactory.target.toString());
    _validateInfo(info);

    info = await registry.getBalancerContractInfo(stablePoolFactory.target.toString());
    _validateInfo(info);

    info = await registry.getBalancerContractInfo(stableSurgePoolFactory.target.toString());
    _validateInfo(info);

    info = await registry.getBalancerContractInfo(lbpFactory.target.toString());
    _validateInfo(info);
  });

  it('has registered the aliases', async () => {
    let [contractAddress, isActive] = await registry.getBalancerContract(ContractType.POOL_FACTORY, 'WeightedPool');
    expect(contractAddress).to.eq(weightedPoolFactory.target.toString());
    expect(isActive).to.be.true;

    [contractAddress, isActive] = await registry.getBalancerContract(ContractType.POOL_FACTORY, 'StablePool');
    expect(contractAddress).to.eq(stablePoolFactory.target.toString());
    expect(isActive).to.be.true;

    [contractAddress, isActive] = await registry.getBalancerContract(ContractType.ROUTER, 'Router');
    expect(contractAddress).to.eq(router.target.toString());
    expect(isActive).to.be.true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function _validateInfo(info: any) {
    expect(info.contractType).to.eq(ContractType.POOL_FACTORY);
    expect(info.isRegistered).to.be.true;
    expect(info.isActive).to.be.true;
  }
});
