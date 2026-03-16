import hre from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { fp } from '@helpers/numbers';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
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

    await authorizer
      .connect(govMultisig)
      .grantRole(await registry.getActionId(registry.interface.getSighash('registerBalancerContract')), admin.address);

    await authorizer
      .connect(govMultisig)
      .grantRole(
        await registry.getActionId(registry.interface.getSighash('addOrUpdateBalancerContractAlias')),
        admin.address
      );
  });

  it('deploys with correct Vault', async () => {
    expect(await registry.getVault()).to.eq(vault.address);
  });

  it('can register a contract', async () => {
    await registry
      .connect(admin)
      .registerBalancerContract(ContractType.POOL_FACTORY, '20241205-v3-weighted-pool', factory.address);
    await registry.connect(admin).addOrUpdateBalancerContractAlias('WeightedPool', factory.address);
  });

  it('detects active contracts', async () => {
    expect(await registry.isActiveBalancerContract(ContractType.POOL_FACTORY, factory.address)).to.be.true;

    let result = await registry.getBalancerContract(ContractType.POOL_FACTORY, '20241205-v3-weighted-pool');
    expect(result.contractAddress).to.eq(factory.address);
    expect(result.isActive).to.be.true;

    result = await registry.getBalancerContract(ContractType.POOL_FACTORY, 'WeightedPool');
    expect(result.contractAddress).to.eq(factory.address);
    expect(result.isActive).to.be.true;
  });

  it('has trusted router', async () => {
    await registry.connect(admin).registerBalancerContract(ContractType.ROUTER, '20241205-v3-router', router.address);

    expect(await registry.isActiveBalancerContract(ContractType.ROUTER, router.address)).to.be.true;
    expect(await registry.isTrustedRouter(router.address)).to.be.true;
    expect(await registry.isTrustedRouter(factory.address)).to.be.false;
  });

  it('handles unregistered contracts', async () => {
    expect(await registry.isActiveBalancerContract(ContractType.ROUTER, factory.address)).to.be.false;
    expect(await registry.isActiveBalancerContract(ContractType.ERC4626, ZERO_ADDRESS)).to.be.false;

    const { contractAddress, isActive } = await registry.getBalancerContract(ContractType.POOL_FACTORY, 'NotThere');
    expect(contractAddress).to.eq(ZERO_ADDRESS);
    expect(isActive).to.be.false;
  });
});
