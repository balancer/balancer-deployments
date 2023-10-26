import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract, ContractReceipt } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { BigNumber, fp } from '@helpers/numbers';
import * as expectEvent from '@helpers/expectEvent';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { impersonate } from '@src';
import { actionId } from '@helpers/models/misc/actions';

// This block number is before the manual weekly checkpoint. This ensures gauges will actually be checkpointed.
// This test verifies the checkpointer against the manual transactions for the given period.
describeForkTest('L2GaugeCheckpointer', 'mainnet', 17332499, function () {
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

  let adderCoordinator: Contract;
  let L2GaugeCheckpointer: Contract;
  let authorizer: Contract, adaptorEntrypoint: Contract;

  let task: Task;
  let daoMultisig: SignerWithAddress, admin: SignerWithAddress;

  const DAO_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const CHECKPOINT_MULTISIG = '0x02f35dA6A02017154367Bc4d47bb6c7D06C7533B';

  // Event we are looking for is:
  // Checkpoint(uint256,uint256)
  // Topic: 0x21d81d5d656869e8ce3ba8d65526a2f0dbbcd3d36f5f9999eb7c84360e45eced
  // See tx: 0x617b441cac07386a37513dfdf351821793d795b3beb1aab1d71dad1bc69a7c86

  // Search for the topic in the given TX.
  // The total expected checkpoints is the amount of checkpoints in the TX + 1 (see Arbitrum gauges below).
  const TOTAL_EXPECTED_CHECKPOINTS = 79;

  // Gauges that are NOT killed for the given test block number.
  const polygonRootGauges: [address: string, expectedCheckpoints: number][] = [
    ['0x082aacfaf4db8ac0642cbed50df732d3c309e679', 6],
    ['0xdd3b4161d2a4c609884e20ed71b4e85be44572e6', 6],
    ['0x16289f675ca54312a8fcf99341e7439982888077', 6],
    ['0x455f20c54b5712a84454468c7831f7c431aeeb1c', 6],
    ['0x39ceebb561a65216a4b776ea752d3137e9d6c0f0', 6],
    ['0x1604b7e80975555e0aceaca9c81807fbb4d65cf1', 6],
    ['0xc534c30749b6c198d35a7836e26076e7745d8936', 6],
    ['0x539d6edbd16f2f069a06716416c3a6e98cc29dd0', 5],
    ['0x31f99c542cbe456fcbbe99d4bf849af4d7fb5405', 6],
    ['0x47d7269829ba9571d98eb6ddc34e9c8f1a4c327f', 6],
    ['0x416d15c36c6daad2b9410b79ae557e6f07dcb642', 1],
    ['0xd103dd49b8051a09b399a52e9a8ab629392de2fb', 1],
  ];

  // There were no Arbitrum checkpoints in this TX, but this gauge was not killed the previous week unlike the rest
  // of the Arbitrum gauges, so it can be checkpointed.
  // It is important to have at least one Arbitrum gauge for the test, because it is the only type that has
  // an associated ETH fee.
  const arbitrumRootGauges: [address: string, expectedCheckpoints: number][] = [
    ['0x8204b749b808818deb7957dbd030ceea44d1fe18', 1],
  ];

  const optimismRootGauges: [address: string, expectedCheckpoints: number][] = [
    ['0xdacd99029b4b94cd04fe364aac370829621c1c64', 6],
  ];

  const gnosisRootGauges: [address: string, expectedCheckpoints: number][] = [
    ['0xe41736b4e78be41bd03ebaf8f86ea493c6e9ea96', 1],
    ['0x21b2ef3dc22b7bd4634205081c667e39742075e2', 1],
    ['0x3b6a85b5e1e6205ebf4d4eabf147d10e8e4bf0a5', 1],
    ['0xcb2c2af6c3e88b4a89aa2aae1d7c8120eee9ad0e', 6],
  ];

  const singleRecipientGauges: [address: string, expectedCheckpoints: number][] = [
    ['0x56124eb16441A1eF12A4CCAeAbDD3421281b795A', 1],
    ['0xE867AD0a48e8f815DC0cda2CDb275e0F163A480b', 1],
  ];

  const checkpointInterface = new ethers.utils.Interface([
    'function checkpoint()',
    'event Checkpoint(uint256 indexed periodTime, uint256 periodEmissions)',
  ]);

  type GaugeData = {
    address: string;
    weight: BigNumber;
    expectedCheckpoints: number;
  };

  const gauges = new Map<GaugeType, GaugeData[]>();

  before('run task', async () => {
    task = new Task('20230527-l2-gauge-checkpointer', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    L2GaugeCheckpointer = await task.deployedInstance('L2GaugeCheckpointer');
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
  });

  // At this block, the adder coordinator has been deployed but not executed.
  // Then, we can fetch the deployed contract and execute it here to setup the correct types in the adder, which are
  // necessary for the checkpointer to work correctly.
  before('run adder migrator coordinator', async () => {
    const adderCoordinatorTask = new Task(
      '20230519-gauge-adder-migration-v3-to-v4',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    adderCoordinator = await adderCoordinatorTask.deployedInstance('GaugeAdderMigrationCoordinator');

    await authorizer.connect(daoMultisig).grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), adderCoordinator.address);
    await adderCoordinator.performNextStage();
  });

  before('get gauge relative weights and associate them with their respective address', async () => {
    const gaugeControllerTask = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');

    const getGaugesData = async (gaugeInputs: [string, number][]) => {
      return Promise.all(
        gaugeInputs.map(async (gaugeInput) => {
          return {
            address: gaugeInput[0],
            weight: await gaugeController['gauge_relative_weight(address)'](gaugeInput[0]),
            expectedCheckpoints: gaugeInput[1],
          };
        })
      );
    };
    const singleRecipientGaugesData: GaugeData[] = await getGaugesData(singleRecipientGauges);
    const polygonRootGaugesData: GaugeData[] = await getGaugesData(polygonRootGauges);
    const arbitrumRootGaugesData: GaugeData[] = await getGaugesData(arbitrumRootGauges);
    const optimismRootGaugesData: GaugeData[] = await getGaugesData(optimismRootGauges);
    const gnosisRootGaugesData: GaugeData[] = await getGaugesData(gnosisRootGauges);

    gauges.set(GaugeType.Ethereum, singleRecipientGaugesData);
    gauges.set(GaugeType.Polygon, polygonRootGaugesData);
    gauges.set(GaugeType.Arbitrum, arbitrumRootGaugesData);
    gauges.set(GaugeType.Optimism, optimismRootGaugesData);
    gauges.set(GaugeType.Gnosis, gnosisRootGaugesData);
  });

  before('check total expected checkpoints', () => {
    let sum = 0;
    for (const [, gaugeData] of gauges.entries()) {
      if (gaugeData.length > 0) {
        sum += gaugeData.map((gaugeData) => gaugeData.expectedCheckpoints).reduce((a, b) => a + b);
      }
    }
    expect(sum).to.be.eq(TOTAL_EXPECTED_CHECKPOINTS);
  });

  before('add gauges to checkpointer', async () => {
    // Some gauges were created from previous factories, so they need to be added by governance.
    // For simplicity, we just add all of them with the same method.
    // The non-permissioned 'addGauges' function is already tested in the unit test.
    await authorizer
      .connect(daoMultisig)
      .grantRole(await actionId(L2GaugeCheckpointer, 'addGaugesWithVerifiedType'), admin.address);

    await Promise.all(
      Array.from(gauges).map(([gaugeType, gaugesData]) => {
        L2GaugeCheckpointer.connect(admin).addGaugesWithVerifiedType(
          GaugeType[gaugeType],
          gaugesData.map((gaugeData) => gaugeData.address)
        );
      })
    );
  });

  before('grant checkpoint permission to gauge checkpointer', async () => {
    // Any gauge works; we just need the interface.
    const gauge = await task.instanceAt('IStakelessGauge', gauges.get(GaugeType.Polygon)![0].address);

    await authorizer
      .connect(daoMultisig)
      .grantRole(
        await adaptorEntrypoint.getActionId(gauge.interface.getSighash('checkpoint')),
        L2GaugeCheckpointer.address
      );
  });

  it('checks that gauges were added correctly', async () => {
    for (const [gaugeType, gaugesData] of gauges.entries()) {
      expect(await L2GaugeCheckpointer.getTotalGauges(GaugeType[gaugeType])).to.be.eq(gaugesData.length);
    }
  });

  describe('getTotalBridgeCost', () => {
    function itChecksTotalBridgeCost(minRelativeWeight: BigNumber) {
      it('checks total bridge cost', async () => {
        const arbitrumGauge = await task.instanceAt('ArbitrumRootGauge', gauges.get(GaugeType.Arbitrum)![0].address);

        const gaugesAmountAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Arbitrum, minRelativeWeight).length;
        const singleGaugeBridgeCost = await arbitrumGauge.getTotalBridgeCost();

        // Bridge cost per gauge is always the same, so total cost is (single gauge cost) * (number of gauges).
        expect(await L2GaugeCheckpointer.getTotalBridgeCost(minRelativeWeight)).to.be.eq(
          singleGaugeBridgeCost.mul(gaugesAmountAboveMinWeight)
        );
      });
    }

    context('when threshold is 1', () => {
      itChecksTotalBridgeCost(fp(1));
    });

    context('when threshold is 0.0001', () => {
      itChecksTotalBridgeCost(fp(0.0001));
    });

    context('when threshold is 0', () => {
      itChecksTotalBridgeCost(fp(0));
    });
  });

  describe('getSingleBridgeCost', () => {
    it('gets the cost for an arbitrum gauge', async () => {
      const arbitrumGauge = await task.instanceAt('ArbitrumRootGauge', gauges.get(GaugeType.Arbitrum)![0].address);
      const bridgeCost = await arbitrumGauge.getTotalBridgeCost();
      const arbitrumType = GaugeType[GaugeType.Arbitrum];
      expect(await L2GaugeCheckpointer.getSingleBridgeCost(arbitrumType, arbitrumGauge.address)).to.be.eq(bridgeCost);
    });

    it('gets the cost for an non-arbitrum gauge', async () => {
      const gnosisGauge = await task.instanceAt('GnosisRootGauge', gauges.get(GaugeType.Gnosis)![0].address);
      const gnosisType = GaugeType[GaugeType.Gnosis];
      expect(await L2GaugeCheckpointer.getSingleBridgeCost(gnosisType, gnosisGauge.address)).to.be.eq(0);
    });

    it('reverts when the gauge address is not present in the type', async () => {
      const gnosisGauge = await task.instanceAt('GnosisRootGauge', gauges.get(GaugeType.Gnosis)![0].address);
      const polygonType = GaugeType[GaugeType.Polygon];
      await expect(L2GaugeCheckpointer.getSingleBridgeCost(polygonType, gnosisGauge.address)).to.be.revertedWith(
        'Gauge was not added to the checkpointer'
      );
    });
  });

  describe('checkpoint', () => {
    sharedBeforeEach(async () => {
      // Gauges that are above a threshold will get another checkpoint attempt when the threshold is lowered.
      // This block takes a snapshot so that gauges can be repeatedly checkpointed without skipping.
    });

    context('when threshold is 1', () => {
      itCheckpointsGaugesAboveRelativeWeight(fp(1), 0);
    });

    context('when threshold is 0.0001', () => {
      itCheckpointsGaugesAboveRelativeWeight(fp(0.0001), 11);
    });

    context('when threshold is 0', () => {
      itCheckpointsGaugesAboveRelativeWeight(fp(0), 20);
    });

    function itCheckpointsGaugesAboveRelativeWeight(minRelativeWeight: BigNumber, gaugesAboveThreshold: number) {
      let performCheckpoint: () => Promise<ContractReceipt>;
      let gaugeDataAboveMinWeight: GaugeData[] = [];
      let ethereumGaugeDataAboveMinWeight: GaugeData[],
        polygonGaugeDataAboveMinWeight: GaugeData[],
        arbitrumGaugeDataAboveMinWeight: GaugeData[],
        optimismGaugeDataAboveMinWeight: GaugeData[],
        gnosisGaugeDataAboveMinWeight: GaugeData[];

      sharedBeforeEach(async () => {
        ethereumGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Ethereum, minRelativeWeight);
        polygonGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Polygon, minRelativeWeight);
        arbitrumGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Arbitrum, minRelativeWeight);
        optimismGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Optimism, minRelativeWeight);
        gnosisGaugeDataAboveMinWeight = getGaugeDataAboveMinWeight(GaugeType.Gnosis, minRelativeWeight);
      });

      context('when checkpointing all types', () => {
        sharedBeforeEach(async () => {
          performCheckpoint = async () => {
            const tx = await L2GaugeCheckpointer.checkpointGaugesAboveRelativeWeight(minRelativeWeight, {
              value: await L2GaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
            });
            return await tx.wait();
          };
          gaugeDataAboveMinWeight = [
            ...ethereumGaugeDataAboveMinWeight,
            ...polygonGaugeDataAboveMinWeight,
            ...arbitrumGaugeDataAboveMinWeight,
            ...optimismGaugeDataAboveMinWeight,
            ...gnosisGaugeDataAboveMinWeight,
          ];

          expect(gaugeDataAboveMinWeight.length).to.be.eq(gaugesAboveThreshold);
        });

        itPerformsCheckpoint();
      });

      context('when checkpointing only Ethereum gauges', () => {
        sharedBeforeEach(async () => {
          performCheckpoint = async () => {
            const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(
              GaugeType[GaugeType.Ethereum],
              minRelativeWeight
            );
            return await tx.wait();
          };
          gaugeDataAboveMinWeight = ethereumGaugeDataAboveMinWeight;
        });

        itPerformsCheckpoint();
      });

      context('when checkpointing only Polygon gauges', () => {
        sharedBeforeEach(async () => {
          performCheckpoint = async () => {
            const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(
              GaugeType[GaugeType.Polygon],
              minRelativeWeight
            );
            return await tx.wait();
          };
          gaugeDataAboveMinWeight = polygonGaugeDataAboveMinWeight;
        });

        itPerformsCheckpoint();
      });

      context('when checkpointing only Arbitrum gauges', () => {
        sharedBeforeEach(async () => {
          performCheckpoint = async () => {
            const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(
              GaugeType[GaugeType.Arbitrum],
              minRelativeWeight,
              {
                value: await L2GaugeCheckpointer.getTotalBridgeCost(minRelativeWeight),
              }
            );
            return await tx.wait();
          };
          gaugeDataAboveMinWeight = arbitrumGaugeDataAboveMinWeight;
        });

        itPerformsCheckpoint();
      });

      context('when checkpointing only Optimism gauges', () => {
        sharedBeforeEach(async () => {
          performCheckpoint = async () => {
            const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(
              GaugeType[GaugeType.Optimism],
              minRelativeWeight
            );
            return await tx.wait();
          };
          gaugeDataAboveMinWeight = optimismGaugeDataAboveMinWeight;
        });

        itPerformsCheckpoint();
      });

      context('when checkpointing only Gnosis gauges', () => {
        sharedBeforeEach(async () => {
          performCheckpoint = async () => {
            const tx = await L2GaugeCheckpointer.checkpointGaugesOfTypeAboveRelativeWeight(
              GaugeType[GaugeType.Gnosis],
              minRelativeWeight
            );
            return await tx.wait();
          };
          gaugeDataAboveMinWeight = gnosisGaugeDataAboveMinWeight;
        });

        itPerformsCheckpoint();
      });

      function itPerformsCheckpoint() {
        it('performs a checkpoint for (non-checkpointed) gauges', async () => {
          const receipt = await performCheckpoint();
          // Check that the right amount of checkpoints were actually performed for every gauge that required them.
          gaugeDataAboveMinWeight.forEach((gaugeData) => {
            expectEvent.inIndirectReceipt(
              receipt,
              checkpointInterface,
              'Checkpoint',
              {},
              gaugeData.address,
              gaugeData.expectedCheckpoints
            );
          });
        });
      }
    }

    describe('single gauge checkpoint', () => {
      context('when checkpointing a single Arbitrum gauge', () => {
        it('performs a checkpoint for (non-checkpointed) gauges', async () => {
          const arbitrumGaugeData = gauges.get(GaugeType.Arbitrum)![0];
          const arbitrumType = GaugeType[GaugeType.Arbitrum];

          const tx = await L2GaugeCheckpointer.checkpointSingleGauge(arbitrumType, arbitrumGaugeData.address, {
            value: await L2GaugeCheckpointer.getSingleBridgeCost(arbitrumType, arbitrumGaugeData.address),
          });
          expectEvent.inIndirectReceipt(
            await tx.wait(),
            checkpointInterface,
            'Checkpoint',
            {},
            arbitrumGaugeData.address,
            arbitrumGaugeData.expectedCheckpoints
          );
        });
      });

      context('when checkpointing a single non-Arbitrum gauge', () => {
        it('performs a checkpoint for (non-checkpointed) gauges', async () => {
          const gnosisGaugeData = gauges.get(GaugeType.Gnosis)![0];
          const gnosisType = GaugeType[GaugeType.Gnosis];

          const tx = await L2GaugeCheckpointer.checkpointSingleGauge(gnosisType, gnosisGaugeData.address);
          expectEvent.inIndirectReceipt(
            await tx.wait(),
            checkpointInterface,
            'Checkpoint',
            {},
            gnosisGaugeData.address,
            gnosisGaugeData.expectedCheckpoints
          );
        });
      });
    });
  });

  function getGaugeDataAboveMinWeight(gaugeType: GaugeType, fpMinRelativeWeight: BigNumber): GaugeData[] {
    return gauges.get(gaugeType)!.filter((addressWeight) => addressWeight.weight.gte(fpMinRelativeWeight));
  }
});
