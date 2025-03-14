import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { fp } from '@helpers/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { describeForkTest, getSigner, getForkedNetwork, impersonate } from '@src';
import { Task, TaskMode } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import * as expectEvent from '@helpers/expectEvent';
import { ProtocolFeeControllerMigrationDeployment } from './input';

describeForkTest('ProtocolFeeControllerMigration', 'mainnet', 22020651, function () {
  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  const POOL_CREATOR_SWAP_FEE = fp(0.1);
  const POOL_CREATOR_YIELD_FEE = fp(0.2);

  let govMultisig: SignerWithAddress;
  let migration: Contract;
  let vault: Contract;
  let vaultExtension: Contract;
  let vaultAdmin: Contract;
  let oldFeeController: Contract;
  let feeController: Contract;
  let vaultAsExtension: Contract;
  let migrationTask: Task;

  let admin: SignerWithAddress;

  let authorizer: Contract;

  let stableSurgePools: string[];
  let testPool: string;
  let testPoolWithCreator: Contract;
  let finalizePermission;
  let input: ProtocolFeeControllerMigrationDeployment;

  before('run task', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');
    vaultAdmin = await vaultTask.deployedInstance('VaultAdmin');
    oldFeeController = await vaultTask.deployedInstance('ProtocolFeeController');

    migrationTask = new Task('20250221-protocol-fee-controller-migration', TaskMode.TEST, getForkedNetwork(hre));
    await migrationTask.run({ force: true });

    migration = await migrationTask.deployedInstance('ProtocolFeeControllerMigration');

    input = migrationTask.input() as ProtocolFeeControllerMigrationDeployment;
    feeController = await migrationTask.instanceAt('ProtocolFeeController', input.ProtocolFeeController);
  });

  before('setup contracts', async () => {
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    admin = await getSigner(0);
  });

  before('grant permissions', async () => {
    govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    finalizePermission = await actionId(migration, 'finalizeMigration');
    const overrideYieldFeePermission = await actionId(oldFeeController, 'setProtocolYieldFeePercentage');

    await authorizer.connect(govMultisig).grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), migration.address);
    await authorizer.connect(govMultisig).grantRole(finalizePermission, admin.address);
    await authorizer.connect(govMultisig).grantRole(overrideYieldFeePermission, admin.address);
  });

  it('performs migration', async () => {
    const weightedPools = [
      //'0x527d0E14acc53FB040DeBeae1cAb973D23FB3568', Mock
      '0xE73fCD4e639739c28ca3Fd5D50237E5f0BD4B048',
      '0xf91c11BA4220b7a72E1dc5E92f2b48D3fdF62726',
      '0x76Bd5a079F57379e9C64A794063EbDB1EdFA38B1',
      '0x4403a2721A9A9956584dc19F553720CEf0Df35b0',
      '0x4D3ac671b1B067e2EF9Fd30437D8b0fE2517B8a2',
      '0xB9b144b5678Ff6527136b2c12A86c9eE5dD12A85',
      '0xd1477d17234508f179BDD47dA32AF711178e58Bd',
      '0x8523BcAdCda4Bd329435940DcC49A7c4c0a14D94',
      '0x4Fd081923824D6AbdaCc862d8449e124A8634b12',
      '0xA8B195D4Df1b91E71e536918ecb3F2D82ec7f326',
      '0x82074b99f3E927658BcAFd81F9948d89192CDF91',
      '0xE633CA1c97aEa2D2c0830E2c34dB526a7F184823',
      '0x66b2975920573Af605054a289B39E10fAA02ECE9',
      '0xea79c1D41F777da7e5b03E62Ac84F33fFB0dEB4f',
    ];

    const stablePools = [
      //'0x89Ef89Fd9a6ec73bcE588F309C1F65C406d2891C', Mock
      '0xc4Ce391d82D164c166dF9c8336DDF84206b2F812',
      '0x57c23c58B1D8C3292c15BEcF07c62C5c52457A42',
      '0x4AB7aB316D43345009B2140e0580B072eEc7DF16',
      '0x89BB794097234E5E930446C0CeC0ea66b35D7570',
      '0x5Dd88b3AA3143173eb26552923922bDf33f50949',
      '0x6649a010CBcF5742E7a13a657Df358556b3e55cF',
      '0x50ec1f7Fa910264d9C09076Cc37b5982642693bd',
      '0xC337E87941f8522468D49344246f5EfBf06c4599',
      '0x89deE01133D18fd24FBFc14CBc6bbD1d4Fc96fFc',
      '0x8B289ED538491d962fCc6DACEA7a04B905Af953B',
      '0xac035537edf62beEF0c7208181379F89deF22119',
      '0x8328eCb1631FaDc0378a8Fd03073429D047888c3',
      '0xc1D48bB722a22Cc6Abf19faCbE27470F08B3dB8c',
      '0x10A04efbA5B880e169920Fd4348527C64FB29d4D',
      '0x85B2b559bC2D21104C4DEFdd6EFcA8A20343361D',
      '0x121edB0bADc036F5FC610D015EE14093C142313B',
      '0x5512fdDC40842b257e2A7742Be3DaDcf31574d53',
      '0xE8769D62A5Ab42F1CbDFA7002e64E4F5896Fc6AF',
      '0xd9005569C381d57506BaefB69f90d1Bb52a023B9',
      '0x90CDc7476F74f124466cAa70a084887F2a41677e',
      '0x66bDa1A7110F6036183225Af0713FD449cBf3214',
      '0x2A2C4CBa6f46a10C1FCAB96bA2AC88E4642a929f',
      '0x64B84023CfE8397dF83C67eACCC2C03ecDA4aeE5',
      '0xaEaCDe217355B4EcF3ccE491C3a1C1E40277B324',
      '0xFfEF9CB7490510240b1b801A2e26689654Fb09f6',
      '0x32b3D72A296AC9D5713b2D34c079903745737D51',
      '0xeCbd1EC8250E44f09dE827b6E3B77F6d6d0dAD0b',
      '0x7Df9B4d7E0387836c1dcf8F80229e3F5cF2B34ED',
      '0xf028Ac624074D6793C36dc8A06ECeC0F5a39a718',
      '0xeb95d6BD67f613E7918A031d9F4a9a92766659aC',
      '0x8fc7287A4604D8f17E9858ee357EE851d3393441',
      '0x0051180Daec0D782f890097afCCb3cA468c65d1b',
      '0xc31496bC7A1EadDA5778361D428a4F981bC204b7',
      '0x9FD8A66E15C3Bf69BA319b8529ccef3504D28344',
      '0x471FAB151550eCA2bb7D078cCC63E2b624eb1240',
    ];

    stableSurgePools = [
      '0xc05ff9851c2a000F3C319D2986D8712317583B79',
      '0xB22bd670c6e57C5Fb486914DC478ae668507ddC8',
      '0x2Bd57acd9f52A8d323a088a072A805108BF015A2',
      '0x2b261C98A81cfda61BeE7BFcf941A3D336be7957',
      '0x9ED5175aeCB6653C1BDaa19793c16fd74fBeEB37',
    ];

    testPool = stableSurgePools[0];

    const [protocolYieldFeePercentage] = await oldFeeController.getPoolProtocolYieldFeeInfo(testPool);

    // Override a yield fee on a test pool, to verify that the override flags are being copied.
    await oldFeeController.connect(admin).setProtocolYieldFeePercentage(testPool, protocolYieldFeePercentage);

    await migration.migratePools(weightedPools);
    await migration.migratePools(stablePools);
    await migration.migratePools(stableSurgePools);
  });

  it('cannot migrate a pool twice', async () => {
    await expect(migration.migratePools([testPool])).to.be.reverted;
  });

  it('finalizes the migration', async () => {
    expect(await migration.isMigrationComplete()).to.be.false;

    // Call finalize to complete the migration.
    await migration.connect(admin).finalizeMigration();

    expect(await migration.isMigrationComplete()).to.be.true;
  });

  it('cannot call migratePools after finalize', async () => {
    await expect(migration.migratePools([])).to.be.reverted;
  });

  it('cannot finalize more than once', async () => {
    await expect(migration.connect(admin).finalizeMigration).to.be.reverted;
  });

  it('copied over the global fee percentages', async () => {
    const oldGlobalSwapFee = await oldFeeController.getGlobalProtocolSwapFeePercentage();
    const oldGlobalYieldFee = await oldFeeController.getGlobalProtocolYieldFeePercentage();

    // They shouldn't be zero.
    expect(oldGlobalSwapFee).gt(0);
    expect(oldGlobalYieldFee).gt(0);

    // The new fees should match.
    expect(await feeController.getGlobalProtocolSwapFeePercentage()).to.eq(oldGlobalSwapFee);
    expect(await feeController.getGlobalProtocolYieldFeePercentage()).to.eq(oldGlobalYieldFee);
  });

  it('copied over the pool fee percentages and overrides', async () => {
    const [oldSwapPercentage] = await oldFeeController.getPoolProtocolSwapFeeInfo(testPool);
    const [oldYieldPercentage] = await oldFeeController.getPoolProtocolYieldFeeInfo(testPool);

    const [protocolSwapFeePercentage, swapOverride] = await feeController.getPoolProtocolSwapFeeInfo(testPool);
    expect(protocolSwapFeePercentage).to.eq(oldSwapPercentage);
    expect(swapOverride).to.be.false;

    const [protocolYieldFeePercentage, yieldOverride] = await feeController.getPoolProtocolYieldFeeInfo(testPool);
    expect(protocolYieldFeePercentage).to.eq(oldYieldPercentage);
    expect(yieldOverride).to.be.true;
  });

  it('vault should be set to the new fee controller', async () => {
    vaultAsExtension = vaultExtension.attach(vault.address);

    expect(await vaultAsExtension.getProtocolFeeController()).to.eq(feeController.address);
  });

  it('does not hold permission to set global fee percentages', async () => {
    const swapPermission = await actionId(feeController, 'getGlobalProtocolSwapFeePercentage');
    expect(await authorizer.hasRole(swapPermission, migration.address)).to.be.false;

    const yieldPermission = await actionId(feeController, 'getGlobalProtocolYieldFeePercentage');
    expect(await authorizer.hasRole(yieldPermission, migration.address)).to.be.false;
  });

  it('does not hold permission to update the fee controller', async () => {
    const permission = await actionId(vaultAdmin, 'setProtocolFeeController');
    expect(await authorizer.hasRole(permission, migration.address)).to.be.false;
  });

  it('renounces the admin role', async () => {
    expect(await authorizer.hasRole(await authorizer.DEFAULT_ADMIN_ROLE(), migration.address)).to.be.false;
  });

  it('deploys a pool with a creator', async () => {
    // Deploy a version of the WeightedPoolFactory that allows pool creators.
    const factoryArgs = [input.Vault, 0, '', ''];
    const factory = await migrationTask.deploy('WeightedPoolFactory', factoryArgs, admin, true);

    const tokensTask = new Task('00000000-tokens', TaskMode.READ_ONLY, getForkedNetwork(hre));

    const fork = getForkedNetwork(hre);

    const WETH = tokensTask.output({ network: fork }).WETH;
    const BAL = tokensTask.output({ network: fork }).BAL;

    const tokenConfig = [
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

    const newWeightedPoolParams = {
      name: 'Mock Weighted Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      normalizedWeights: [fp(0.8), fp(0.2)],
      roleAccounts: {
        pauseManager: ZERO_ADDRESS,
        swapFeeManager: ZERO_ADDRESS,
        poolCreator: admin.address,
      },
      swapFeePercentage: fp(0.01),
      hooksAddress: ZERO_ADDRESS,
      enableDonations: false,
      disableUnbalancedLiquidity: false,
      salt: ONES_BYTES32,
    };

    const poolCreationReceipt = await (
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
    testPoolWithCreator = await migrationTask.instanceAt('WeightedPool', event.args.pool);
  });

  it('sets a pool creator fee', async () => {
    await feeController
      .connect(admin)
      .setPoolCreatorSwapFeePercentage(testPoolWithCreator.address, POOL_CREATOR_SWAP_FEE);
    await feeController
      .connect(admin)
      .setPoolCreatorYieldFeePercentage(testPoolWithCreator.address, POOL_CREATOR_YIELD_FEE);

    expect(await feeController.getPoolCreatorSwapFeePercentage(testPoolWithCreator.address)).to.eq(
      POOL_CREATOR_SWAP_FEE
    );
    expect(await feeController.getPoolCreatorYieldFeePercentage(testPoolWithCreator.address)).to.eq(
      POOL_CREATOR_YIELD_FEE
    );
  });

  it('sets up for a second migration', async () => {
    oldFeeController = feeController;

    const feeControllerTask = new Task('20250214-v3-protocol-fee-controller-v2', TaskMode.TEST, getForkedNetwork(hre));
    await feeControllerTask.run({ force: true });

    feeController = await feeControllerTask.deployedInstance('ProtocolFeeController');
    migration = await migrationTask.deploy(
      'ProtocolFeeControllerMigration',
      [input.Vault, feeController.address],
      admin,
      true // force
    );

    // Need to grant permissions to the new migration
    await authorizer.connect(govMultisig).grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), migration.address);
    finalizePermission = await actionId(migration, 'finalizeMigration');
    await authorizer.connect(govMultisig).grantRole(finalizePermission, admin.address);
  });

  it('migrates the pool to a new controller', async () => {
    expect(await vaultAsExtension.getProtocolFeeController()).to.eq(oldFeeController.address);

    await migration.migratePools([testPoolWithCreator.address]);
    await migration.connect(admin).finalizeMigration();

    expect(await vaultAsExtension.getProtocolFeeController()).to.eq(feeController.address);
  });

  it('copies the pool creator percentages', async () => {
    expect(await feeController.getPoolCreatorSwapFeePercentage(testPoolWithCreator.address)).to.eq(
      POOL_CREATOR_SWAP_FEE
    );
    expect(await feeController.getPoolCreatorYieldFeePercentage(testPoolWithCreator.address)).to.eq(
      POOL_CREATOR_YIELD_FEE
    );
  });
});
