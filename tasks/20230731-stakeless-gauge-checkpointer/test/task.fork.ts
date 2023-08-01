import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { BigNumber, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { impersonate } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { WEEK, currentWeekTimestamp } from '@helpers/time';

// This fork test verifies a corner case to validate the changes introduced in this checkpointer's version.
// The only gauge under test should have been checkpointed at this block.
// The contract in `20230527-l2-gauge-checkpointer` would skip it because it measures the gauge relative weight in
// the current week, whereas the new version does so in the previous week.
describeForkTest('StakelessGaugeCheckpointer', 'mainnet', 17431930, function () {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */

  enum GaugeType {
    Ethereum,
    Polygon,
    Arbitrum,
    Optimism,
    Gnosis,
    Avalanche,
    PolygonZkEvm,
    ZkSync,
  }

  let gaugeController: Contract;
  let stakelessGaugeCheckpointer: Contract;
  let authorizer: Contract, adaptorEntrypoint: Contract;

  let task: Task;
  let daoMultisig: SignerWithAddress, admin: SignerWithAddress;

  const WEIGHT_THRESHOLD = fp(0.002); // 0.2%

  const DAO_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const CHECKPOINT_MULTISIG = '0x02f35dA6A02017154367Bc4d47bb6c7D06C7533B';

  const arbitrumRootGauge = '0xB5044FD339A7b858095324cC3F239C212956C179';
  const expectedCheckpoints = 8;

  const checkpointInterface = new ethers.utils.Interface([
    'function checkpoint()',
    'event Checkpoint(uint256 indexed periodTime, uint256 periodEmissions)',
  ]);

  type GaugeData = {
    address: string;
    weight: BigNumber;
    expectedCheckpoints: number;
  };

  let gaugeData: GaugeData;

  before('run task', async () => {
    task = new Task('20230731-stakeless-gauge-checkpointer', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    stakelessGaugeCheckpointer = await task.deployedInstance('StakelessGaugeCheckpointer');
  });

  before('setup governance', async () => {
    daoMultisig = await impersonate(DAO_MULTISIG, fp(100));
    admin = await impersonate(CHECKPOINT_MULTISIG, fp(100));
  });

  before('setup contracts', async () => {
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const adaptorEntrypointTask = new Task(
      '20221124-authorizer-adaptor-entrypoint',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    adaptorEntrypoint = await adaptorEntrypointTask.deployedInstance('AuthorizerAdaptorEntrypoint');

    const gaugeControllerTask = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, getForkedNetwork(hre));
    gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
  });

  before('add gauge to checkpointer', async () => {
    // This gauge was created by a previous factory, so we just add it via governance providing the right type.
    await authorizer
      .connect(daoMultisig)
      .grantRole(await actionId(stakelessGaugeCheckpointer, 'addGaugesWithVerifiedType'), admin.address);

    await stakelessGaugeCheckpointer
      .connect(admin)
      .addGaugesWithVerifiedType(GaugeType[GaugeType.Arbitrum], [arbitrumRootGauge]);
  });

  before('grant checkpoint permission to gauge checkpointer', async () => {
    // Any gauge works; we just need the interface.
    const gauge = await task.instanceAt('IStakelessGauge', arbitrumRootGauge);

    await authorizer
      .connect(daoMultisig)
      .grantRole(
        await adaptorEntrypoint.getActionId(gauge.interface.getSighash('checkpoint')),
        stakelessGaugeCheckpointer.address
      );
  });

  before('check relative weight and store gauge data', async () => {
    // Here we verify that we are effectively testing a corner case, and that the gauge can still be checkpointed.
    // The gauge under test was created several weeks before the block specified in the fork test.
    // It meets 3 conditions, explained below.
    const currentWeek = await currentWeekTimestamp();
    const previousWeek = currentWeek.sub(WEEK);
    const relativeWeightPreviousWeek = await gaugeController['gauge_relative_weight(address,uint256)'](
      arbitrumRootGauge,
      previousWeek
    );
    // 1) The weight of the gauge in the previous week is non-zero, and greater than a given threshold.
    expect(relativeWeightPreviousWeek).to.be.gte(WEIGHT_THRESHOLD);

    // 2) The gauge is not up to date in the controller.
    const latestCheckpointedTime = await gaugeController.time_weight(arbitrumRootGauge);
    expect(latestCheckpointedTime).to.be.lt(currentWeek);

    // 3) The weight at the current week is 0.
    const relativeWeightNow = await gaugeController['gauge_relative_weight(address)'](arbitrumRootGauge);
    expect(relativeWeightNow).to.be.eq(0);

    gaugeData = {
      address: arbitrumRootGauge,
      weight: relativeWeightPreviousWeek,
      expectedCheckpoints,
    };
  });

  it('checks that gauges were added correctly', async () => {
    expect(await stakelessGaugeCheckpointer.getTotalGauges(GaugeType[GaugeType.Arbitrum])).to.be.eq(1);
  });

  describe('checkpoint', () => {
    sharedBeforeEach(async () => {
      // Gauges that are above a threshold will get another checkpoint attempt when the threshold is lowered.
      // This block takes a snapshot so that gauges can be repeatedly checkpointed without skipping.
    });

    context('when threshold is above gauge weight', () => {
      const minRelativeWeight = WEIGHT_THRESHOLD.mul(10);

      it('skips the gauge', async () => {
        const tx = await stakelessGaugeCheckpointer.checkpointGaugesAboveRelativeWeight(minRelativeWeight, {
          value: await stakelessGaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
        });

        expectEvent.notEmitted(await tx.wait(), 'Checkpoint');
      });
    });

    context('when threshold below gauge weight', () => {
      const minRelativeWeight = WEIGHT_THRESHOLD;

      it('performs the checkpoint', async () => {
        const tx = await stakelessGaugeCheckpointer.checkpointGaugesAboveRelativeWeight(minRelativeWeight, {
          value: await stakelessGaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
        });

        expectEvent.inIndirectReceipt(
          await tx.wait(),
          checkpointInterface,
          'Checkpoint',
          {},
          gaugeData.address,
          gaugeData.expectedCheckpoints
        );
      });
    });
  });
});
