import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';
import { describeForkTest, getForkedNetwork, Task, TaskMode, getSigner, impersonate } from '@src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProtocolFeeControllerDeployment } from '../input';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';

describeForkTest('ProtocolFeeController', 'mainnet', 21827132, function () {
  const TASK_NAME = '20250214-v3-protocol-fee-controller-v2';
  const CONTRACT_NAME = 'ProtocolFeeController';
  const POOL_CONTRACT_NAME = 'WeightedPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const GLOBAL_SWAP_FEE_PERCENTAGE = fp(0.05);
  const GLOBAL_YIELD_FEE_PERCENTAGE = fp(0.25);

  let task: Task;
  let weightedTask: Task;
  let feeController: Contract;
  let authorizer: Contract;
  let vault: Contract;
  let vaultAdmin: Contract;
  let vaultExtension: Contract;
  let factory: Contract;
  let pool: Contract;
  let input: ProtocolFeeControllerDeployment;
  let admin: SignerWithAddress;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let poolCreationReceipt: any;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    feeController = await task.deployedInstance(CONTRACT_NAME);

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultAdmin = await vaultTask.deployedInstance('VaultAdmin');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    weightedTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    factory = await weightedTask.deployedInstance(FACTORY_CONTRACT_NAME);

    input = task.input() as ProtocolFeeControllerDeployment;
    admin = await getSigner();
  });

  before('setup contracts and parameters', async () => {
    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY);

    const fork = getForkedNetwork(hre);

    const WETH = tokensTask.output({ network: fork }).WETH;
    const BAL = tokensTask.output({ network: fork }).BAL;

    tokenConfig = [
      {
        token: WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: BAL,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  it('deploys contract', async () => {
    expect(await feeController.vault()).to.eq(input.Vault);
  });

  it('grants permissions', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Allow admin to upgrade the protocol fee controller to the version with events.
    await authorizer
      .connect(govMultisig)
      .grantRole(
        await vaultAdmin.getActionId(vaultAdmin.interface.getSighash('setProtocolFeeController')),
        admin.address
      );

    // Allow admin to set global fees, so that pools will be created with non-zero initial percentages.
    // No standard factories allow turning off fees, but that's fine. We're just testing that the event comes through.
    await authorizer
      .connect(govMultisig)
      .grantRole(
        await feeController.getActionId(feeController.interface.getSighash('setGlobalProtocolSwapFeePercentage')),
        admin.address
      );

    await authorizer
      .connect(govMultisig)
      .grantRole(
        await feeController.getActionId(feeController.interface.getSighash('setGlobalProtocolYieldFeePercentage')),
        admin.address
      );
  });

  it('replaces the old fee controller', async () => {
    const vaultAsExtension = vaultExtension.attach(vault.address);
    const oldFeeControllerAddress = await vaultAsExtension.getProtocolFeeController();

    const vaultAsAdmin = vaultAdmin.attach(vault.address);
    await vaultAsAdmin.connect(admin).setProtocolFeeController(feeController.address);

    const newFeeControllerAddress = await vaultAsExtension.getProtocolFeeController();
    expect(newFeeControllerAddress).not.to.eq(oldFeeControllerAddress);
    expect(newFeeControllerAddress).to.eq(feeController.address);
  });

  it('sets non-zero global fees', async () => {
    await feeController.connect(admin).setGlobalProtocolSwapFeePercentage(GLOBAL_SWAP_FEE_PERCENTAGE);
    await feeController.connect(admin).setGlobalProtocolYieldFeePercentage(GLOBAL_YIELD_FEE_PERCENTAGE);

    expect(await feeController.getGlobalProtocolSwapFeePercentage()).to.eq(GLOBAL_SWAP_FEE_PERCENTAGE);
    expect(await feeController.getGlobalProtocolYieldFeePercentage()).to.eq(GLOBAL_YIELD_FEE_PERCENTAGE);
  });

  it('deploys a pool and gets the events', async () => {
    const newWeightedPoolParams = {
      name: 'Mock Weighted Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      normalizedWeights: [fp(0.8), fp(0.2)],
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: ZERO_ADDRESS,
      },
      swapFeePercentage: fp(0.01),
      hooksAddress: ZERO_ADDRESS,
      enableDonations: false,
      disableUnbalancedLiquidity: false,
      salt: ONES_BYTES32,
    };

    poolCreationReceipt = await (
      await factory.create(
        newWeightedPoolParams.name,
        newWeightedPoolParams.symbol,
        newWeightedPoolParams.tokens,
        newWeightedPoolParams.normalizedWeights,
        newWeightedPoolParams.roleAccounts,
        newWeightedPoolParams.swapFeePercentage,
        newWeightedPoolParams.hooksAddress,
        newWeightedPoolParams.enableDonations,
        newWeightedPoolParams.disableUnbalancedLiquidity,
        newWeightedPoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await weightedTask.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool deployment', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });

  it('pool creation emits initial fee events', async () => {
    const swapFeeEvent = expectEvent.inIndirectReceipt(
      poolCreationReceipt,
      feeController.interface,
      'InitialPoolAggregateSwapFeePercentage'
    );

    expect(swapFeeEvent.args.pool).to.eq(pool.address);
    expect(swapFeeEvent.args.aggregateSwapFeePercentage).to.eq(GLOBAL_SWAP_FEE_PERCENTAGE);
    expect(swapFeeEvent.args.isProtocolFeeExempt).to.be.false;

    const yieldFeeEvent = expectEvent.inIndirectReceipt(
      poolCreationReceipt,
      feeController.interface,
      'InitialPoolAggregateYieldFeePercentage'
    );

    expect(yieldFeeEvent.args.pool).to.eq(pool.address);
    expect(yieldFeeEvent.args.aggregateYieldFeePercentage).to.eq(GLOBAL_YIELD_FEE_PERCENTAGE);
    expect(yieldFeeEvent.args.isProtocolFeeExempt).to.be.false;

    const poolCreatorEvent = expectEvent.inIndirectReceipt(
      poolCreationReceipt,
      feeController.interface,
      'PoolRegisteredWithFeeController'
    );

    expect(poolCreatorEvent.args.pool).to.eq(pool.address);
    expect(poolCreatorEvent.args.poolCreator).to.eq(ZERO_ADDRESS);
    expect(poolCreatorEvent.args.protocolFeeExempt).to.be.false;
  });

  it('checks pool aggregate fees', async () => {
    const [aggregateSwapFeePercentage, aggregateYieldFeePercentage] = await pool.getAggregateFeePercentages();

    expect(aggregateSwapFeePercentage).to.eq(GLOBAL_SWAP_FEE_PERCENTAGE);
    expect(aggregateYieldFeePercentage).to.eq(GLOBAL_YIELD_FEE_PERCENTAGE);
  });

  it('has new getters', async () => {
    expect(await feeController.isPoolRegistered(pool.address)).to.be.true;
    expect(await feeController.getPoolCreatorSwapFeePercentage(pool.address)).to.eq(0);
    expect(await feeController.getPoolCreatorYieldFeePercentage(pool.address)).to.eq(0);
  });
});
