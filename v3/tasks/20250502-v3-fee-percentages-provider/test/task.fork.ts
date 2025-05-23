import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { ProtocolFeePercentagesProviderDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { fp } from '@helpers/numbers';
import { actionId } from '@helpers/models/misc/actions';

describeForkTest('V3-FactoryFeeHelper', 'mainnet', 22342890, function () {
  enum ContractType {
    OTHER,
    POOL_FACTORY,
    ROUTER,
    HOOK,
    ERC4626,
  }

  const TASK_NAME = '20250502-v3-fee-percentages-provider';
  const CONTRACT_NAME = 'ProtocolFeePercentagesProvider';

  const PROTOCOL_SWAP_FEE = fp(0.0523);
  const PROTOCOL_YIELD_FEE = fp(0.02512);

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  let task: Task;
  let factory: Contract;
  let feeHelper: Contract;
  let authorizer: Contract;
  let registry: Contract;
  let feeController: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let pool: Contract;

  let admin: SignerWithAddress;

  let input: ProtocolFeePercentagesProviderDeployment;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    feeHelper = await task.deployedInstance(CONTRACT_NAME);
  });

  before('setup contracts', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    factory = await poolTask.deployedInstance('WeightedPoolFactory');
    pool = await poolTask.instanceAt('WeightedPool', poolTask.output().MockWeightedPool);

    const registryTask = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY, getForkedNetwork(hre));
    registry = await registryTask.deployedInstance('BalancerContractRegistry');

    const vaultAsExtension = vaultExtension.attach(vault.address);
    const feeControllerAddress = await vaultAsExtension.getProtocolFeeController();
    feeController = await task.instanceAt('ProtocolFeeController', feeControllerAddress);

    input = task.input() as ProtocolFeePercentagesProviderDeployment;

    admin = await getSigner();
  });

  before('grant permissions', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Allow adding the factory to the contract.
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(registry, 'registerBalancerContract'), admin.address);

    // Let the admin set factory fees.
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeHelper, 'setFactorySpecificProtocolFeePercentages'), admin.address);

    // Let the fee helper set the actual fees.
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeController, 'setProtocolSwapFeePercentage'), feeHelper.address);

    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(feeController, 'setProtocolYieldFeePercentage'), feeHelper.address);
  });

  before('add contract to registry', async () => {
    await registry
      .connect(admin)
      .registerBalancerContract(ContractType.POOL_FACTORY, '20241205-v3-weighted-pool', factory.address);
  });

  it('stores the contracts', async () => {
    expect(await feeHelper.getProtocolFeeController()).to.eq(feeController.address);
    expect(await feeHelper.getBalancerContractRegistry()).to.eq(input.BalancerContractRegistry);
    expect(await feeHelper.getVault()).to.eq(input.Vault);
  });

  it('can add to the registry', async () => {
    expect(await registry.isActiveBalancerContract(ContractType.POOL_FACTORY, factory.address)).to.be.true;
  });

  it('can set protocol fees', async () => {
    await feeHelper
      .connect(admin)
      .setFactorySpecificProtocolFeePercentages(factory.address, PROTOCOL_SWAP_FEE, PROTOCOL_YIELD_FEE);
    await feeHelper.setProtocolFeePercentagesForPools(factory.address, [pool.address]);

    const [actualSwapFee] = await feeController.getPoolProtocolSwapFeeInfo(pool.address);
    const [actualYieldFee] = await feeController.getPoolProtocolYieldFeeInfo(pool.address);

    expect(actualSwapFee).to.eq(PROTOCOL_SWAP_FEE);
    expect(actualYieldFee).to.eq(PROTOCOL_YIELD_FEE);
  });
});
