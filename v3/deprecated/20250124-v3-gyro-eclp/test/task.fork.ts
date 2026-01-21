import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { ONES_BYTES32, ZERO_ADDRESS } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import { GyroECLPPoolDeployment } from '../input';

describeForkTest.skip('GyroECLPPool-V3', 'mainnet', 21818600, function () {
  let task: Task;
  let factory: Contract, pool: Contract;
  let input: GyroECLPPoolDeployment;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenConfig: any[];

  const TASK_NAME = '20250124-v3-gyro-eclp';
  const POOL_CONTRACT_NAME = 'GyroECLPPool';
  const FACTORY_CONTRACT_NAME = POOL_CONTRACT_NAME + 'Factory';
  const BAL_TOKEN = '0xba100000625a3754423978a60c9317c58a424e3D';

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance(FACTORY_CONTRACT_NAME);
  });

  before('setup contracts and parameters', async () => {
    input = task.input() as GyroECLPPoolDeployment;
    tokenConfig = [
      {
        token: input.WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: BAL_TOKEN,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });
  });

  it('deploys pool', async () => {
    // Extracted from pool 0x2191df821c198600499aa1f0031b1a7514d7a7d9 on Mainnet.
    const PARAMS_ALPHA = bn('998502246630054917');
    const PARAMS_BETA = bn('1000200040008001600');
    const PARAMS_C = bn('707106781186547524');
    const PARAMS_S = bn('707106781186547524');
    const PARAMS_LAMBDA = bn('4000000000000000000000');

    const TAU_ALPHA_X = bn('-94861212813096057289512505574275160547');
    const TAU_ALPHA_Y = bn('31644119574235279926451292677567331630');
    const TAU_BETA_X = bn('37142269533113549537591131345643981951');
    const TAU_BETA_Y = bn('92846388265400743995957747409218517601');
    const U = bn('66001741173104803338721745994955553010');
    const V = bn('62245253919818011890633399060291020887');
    const W = bn('30601134345582732000058913853921008022');
    const Z = bn('-28859471639991253843240999485797747790');
    const DSQ = bn('99999999999999999886624093342106115200');

    const tokenConfig = [
      {
        token: input.WETH,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
      {
        token: BAL_TOKEN,
        tokenType: 0,
        rateProvider: ZERO_ADDRESS,
        paysYieldFees: false,
      },
    ].sort(function (a, b) {
      return a.token.toLowerCase().localeCompare(b.token.toLowerCase());
    });

    const eclpParams = {
      alpha: PARAMS_ALPHA,
      beta: PARAMS_BETA,
      c: PARAMS_C,
      s: PARAMS_S,
      lambda: PARAMS_LAMBDA,
    };
    const derivedEclpParams = {
      tauAlpha: { x: TAU_ALPHA_X, y: TAU_ALPHA_Y },
      tauBeta: { x: TAU_BETA_X, y: TAU_BETA_Y },
      u: U,
      v: V,
      w: W,
      z: Z,
      dSq: DSQ,
    };

    const newGyroECLPPoolParams = {
      name: 'DO NOT USE - Mock Gyro ECLP Pool',
      symbol: 'TEST',
      tokens: tokenConfig,
      eclpParams,
      derivedEclpParams,
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

    const poolCreationReceipt = await (
      await factory.create(
        newGyroECLPPoolParams.name,
        newGyroECLPPoolParams.symbol,
        newGyroECLPPoolParams.tokens,
        newGyroECLPPoolParams.eclpParams,
        newGyroECLPPoolParams.derivedEclpParams,
        newGyroECLPPoolParams.roleAccounts,
        newGyroECLPPoolParams.swapFeePercentage,
        newGyroECLPPoolParams.hooksAddress,
        newGyroECLPPoolParams.enableDonations,
        newGyroECLPPoolParams.disableUnbalancedLiquidity,
        newGyroECLPPoolParams.salt
      )
    ).wait();

    const event = expectEvent.inReceipt(poolCreationReceipt, 'PoolCreated');
    pool = await task.instanceAt(POOL_CONTRACT_NAME, event.args.pool);
  });

  it('checks pool tokens', async () => {
    const poolTokens = (await pool.getTokens()).map((token: string) => token.toLowerCase());
    expect(poolTokens).to.be.deep.eq(tokenConfig.map((config) => config.token.toLowerCase()));
  });

  it('checks pool version', async () => {
    const version = JSON.parse(await pool.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(1);
    expect(version.name).to.be.eq(POOL_CONTRACT_NAME);
  });

  it('checks factory version', async () => {
    const version = JSON.parse(await factory.version());
    expect(version.deployment).to.be.eq(TASK_NAME);
    expect(version.version).to.be.eq(1);
    expect(version.name).to.be.eq(FACTORY_CONTRACT_NAME);
  });
});
