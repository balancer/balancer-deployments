import hre from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { fp } from '@helpers/numbers';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { ZERO_ADDRESS } from '@helpers/constants';

describeForkTest('BalancerContractRegistry-V3', 'mainnet', 21436200, function () {
  enum ContractType {
    OTHER,
    POOL_FACTORY,
    ROUTER,
    HOOK,
    ERC4626,
  }

  let task: Task;
  let admin: SignerWithAddress;
  let registry: Contract;
  let vault: Contract;
  let factory: Contract;
  let router: Contract;
  let authorizer: Contract;

  const deploymentId = '20250117-v3-contract-registry';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  before('run task', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    factory = await poolTask.deployedInstance('WeightedPoolFactory');

    const routerTask = new Task('20241205-v3-router', TaskMode.READ_ONLY, getForkedNetwork(hre));
    router = await routerTask.deployedInstance('Router');

    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    registry = await task.deployedInstance('BalancerContractRegistry');

    admin = await getSigner();
  });

  before('grant permissions', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    await (authorizer.connect(govMultisig) as Contract).grantRole(
      await registry.getActionId(registry.interface.getFunction('registerBalancerContract')!.selector),
      admin.address
    );

    await (authorizer.connect(govMultisig) as Contract).grantRole(
      await registry.getActionId(registry.interface.getFunction('addOrUpdateBalancerContractAlias')!.selector),
      admin.address
    );
  });

  it('deploys with correct Vault', async () => {
    expect(await registry.getVault()).to.eq(vault.target.toString());
  });

  it('can register a contract', async () => {
    await (registry.connect(admin) as Contract).registerBalancerContract(
      ContractType.POOL_FACTORY,
      '20241205-v3-weighted-pool',
      factory.target.toString()
    );
    await (registry.connect(admin) as Contract).addOrUpdateBalancerContractAlias(
      'WeightedPool',
      factory.target.toString()
    );
  });

  it('detects active contracts', async () => {
    expect(await registry.isActiveBalancerContract(ContractType.POOL_FACTORY, factory.target.toString())).to.be.true;

    let result = await registry.getBalancerContract(ContractType.POOL_FACTORY, '20241205-v3-weighted-pool');
    expect(result.contractAddress).to.eq(factory.target.toString());
    expect(result.isActive).to.be.true;

    result = await registry.getBalancerContract(ContractType.POOL_FACTORY, 'WeightedPool');
    expect(result.contractAddress).to.eq(factory.target.toString());
    expect(result.isActive).to.be.true;
  });

  it('has trusted router', async () => {
    await (registry.connect(admin) as Contract).registerBalancerContract(
      ContractType.ROUTER,
      '20241205-v3-router',
      router.target.toString()
    );

    expect(await registry.isActiveBalancerContract(ContractType.ROUTER, router.target.toString())).to.be.true;
    expect(await registry.isTrustedRouter(router.target.toString())).to.be.true;
    expect(await registry.isTrustedRouter(factory.target.toString())).to.be.false;
  });

  it('handles unregistered contracts', async () => {
    expect(await registry.isActiveBalancerContract(ContractType.ROUTER, factory.target.toString())).to.be.false;
    expect(await registry.isActiveBalancerContract(ContractType.ERC4626, ZERO_ADDRESS)).to.be.false;

    const { contractAddress, isActive } = await registry.getBalancerContract(ContractType.POOL_FACTORY, 'NotThere');
    expect(contractAddress).to.equal(ZERO_ADDRESS);
    expect(isActive).to.be.false;
  });
});
