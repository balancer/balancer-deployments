import { ZERO_ADDRESS, ZERO_BYTES32 } from '@helpers/constants';
import { bn, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { saveContractDeploymentTransactionHash } from '@src';
import { Task, TaskMode, TaskRunOptions } from '@src';
import { GyroECLPPoolDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as GyroECLPPoolDeployment;

  const args = [input.Vault, input.PauseWindowDuration, input.FactoryVersion, input.PoolVersion];
  const factory = await task.deployAndVerify('GyroECLPPoolFactory', args, from, force);

  if (task.mode === TaskMode.LIVE) {
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
        token: input.BAL,
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
      salt: ZERO_BYTES32,
    };

    // This mimics the logic inside task.deploy
    if (force || !task.output({ ensure: false })['MockGyro2CLPPool']) {
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
      const mockPoolAddress = event.args.pool;

      await saveContractDeploymentTransactionHash(mockPoolAddress, poolCreationReceipt.transactionHash, task.network);
      await task.save({ MockGyro2CLPPool: mockPoolAddress });
    }

    const mockPool = await task.instanceAt('Gyro2CLPPool', task.output()['MockGyro2CLPPool']);

    const poolParams = {
      name: newGyroECLPPoolParams.name,
      symbol: newGyroECLPPoolParams.symbol,
      eclpParams: newGyroECLPPoolParams.eclpParams,
      derivedEclpParams: newGyroECLPPoolParams.derivedEclpParams,
      version: await factory.getPoolVersion(),
    };

    // We are now ready to verify the Pool
    await task.verify('Gyro2CLPPool', mockPool.address, [poolParams, input.Vault]);
  }
};
