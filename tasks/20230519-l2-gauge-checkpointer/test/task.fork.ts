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
describeForkTest('L2GaugeCheckpointerV2', 'mainnet', 17185740, function () {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */

  enum GaugeType {
    Ethereum,
    Polygon,
    Arbitrum,
    Optimism,
    Gnosis,
    Avalanche,
    PolygonZKEvm,
    ZkSync,
  }

  let L2GaugeCheckpointer: Contract;
  let vault: Contract, authorizer: Contract, authorizerWrapper: Contract, adaptorEntrypoint: Contract;

  let task: Task;
  let daoMultisig: SignerWithAddress;

  const DAO_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  // Gauges that are NOT killed for the given test block number.
  // See tx: 0x86f1acf38dc80701fbafdb01bc6806bd40612773eb39b4fd92228ea2574ca8ab
  const polygonRootGauges: [address: string, expectedCheckpoints: number][] = [
    // ['0x2C967D6611C60274db45E0BB34c64fb5F504eDE7', 1], // is killed
    ['0x88D07558470484c03d3bb44c3ECc36CAfCF43253', 1],
    ['0xA5A0B6598B90d214eAf4d7a6b72d5a89C3b9A72c', 1],
    ['0xe42382D005A620FaaA1B82543C9c04ED79Db03bA', 1],
    ['0xcF5938cA6d9F19C73010c7493e19c02AcFA8d24D', 1],
    // ['0xf7C3B4e1EdcB00f0230BFe03D937e26A5e654fD4', 1], // is killed
    // ['0xfbf87d2c22d1d298298ab5b0ec957583a2731d15', 1],
    // ['0xb34d43ada4105ff71e89b8b22a8b9562e78f01e3', 1],
    // ['0xbbcd2045ac43f79e8494600e72ca8af455e309dd', 1],
    ['0x1E0C21296bF29EE2d56e0abBDfbBEdF2530A7c9A', 1],
    ['0xE77239359CE4D445Fed27C17Da23B8024d35e456', 1],
    ['0xF0d887c1f5996C91402EB69Ab525f028DD5d7578', 1],
    ['0x21a3De9292569F599e4cf83c741862705bf4f108', 1],
    ['0x90437a1D2F6C0935Dd6056f07f05C068f2A507F9', 1],
    ['0x0DB3F34d07682B7C61B0B72D02a26CD3cBDBBdd0', 1],
    ['0x28D4FE67c68d340fe66CfbCBe8e2cd279d8AA6dD', 1],
    ['0x6a08FD22bd3B10a8EB322938FCaa0A1B025BF3b3', 1],
    ['0xBD734b38F2dc864fe00DF51fc4F17d310eD7dA4D', 1],
    ['0x87F678f4F84e5665e1A85A22392fF5A84adC22cD', 1],
    ['0x43E4bE3A89985c4f1fCB4c2D3bd7e6E0C5df42D3', 1],
  ];

  // See tx: 0x86f1acf38dc80701fbafdb01bc6806bd40612773eb39b4fd92228ea2574ca8ab
  const arbitrumRootGauges: [address: string, expectedCheckpoints: number][] = [
    ['0x359ea8618c405023fc4b98dab1b01f373792a126', 1],
    // ['0xf0ea3559cf098455921d74173da83ff2f6979495', 1],
    ['0x68ebb057645258cc62488fd198a0f0fa3fd6e8fb', 1],
    // ['0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e', 1],
    ['0x87ae77a8270f223656d9dc40ad51aabfab424b30', 1],
    ['0x6823DcA6D70061F2AE2AAA21661795A2294812bF', 1],
    ['0x519cCe718FCD11AC09194CFf4517F12D263BE067', 1],
    ['0x5b0C1b84566708Dd391Ae0FecE1a32e33682EE3d', 1],
    ['0x19ff30f9B2d32bfb0F21f2DB6c6A3A8604Eb8C2B', 1],
    ['0xad2632513bFd805A63aD3e38D24EE10835877d41', 1],
  ];

  // See tx: 0x86f1acf38dc80701fbafdb01bc6806bd40612773eb39b4fd92228ea2574ca8ab
  const optimismRootGauges: [address: string, expectedCheckpoints: number][] = [
    ['0xfb0265841c49a6b19d70055e596b212b0da3f606', 1],
    // ['0x8b815a11d0d9eeee6861d1c5510d6faa2c6e3feb', 1],
    // ['0x78f50cf01a2fd78f04da1d9acf14a51487ec0347', 1],
  ];

  // See tx: 0x86f1acf38dc80701fbafdb01bc6806bd40612773eb39b4fd92228ea2574ca8ab
  const gnosisRootGauges: [address: string, expectedCheckpoints: number][] = [
    ['0x25D6F29429bccCc129d1A3e2a5642C8B929BCC07', 1],
    ['0xd27671f057e9e72751106fBfbBBB33827D986546', 1],
    ['0x3FB2975E00B3dbB97E8315a5ACbFF6B38026FDf3', 1],
    ['0x56A65cC666bfe538c5a031942369F6F63eb42240', 1],
    ['0xEd510769CCf53eA14388Fc9d6E98EDa5b1a5BAC8', 1],
  ];

  // See tx: 0x86f1acf38dc80701fbafdb01bc6806bd40612773eb39b4fd92228ea2574ca8ab
  const singleRecipientGauges: [address: string, expectedCheckpoints: number][] = [
    ['0x56124eb16441A1eF12A4CCAeAbDD3421281b795A', 1],
    ['0xE867AD0a48e8f815DC0cda2CDb275e0F163A480b', 1],
  ];

  type GaugeData = {
    address: string;
    weight: BigNumber;
    expectedCheckpoints: number;
  };

  const gauges = new Map<GaugeType, GaugeData[]>();

  before('run task', async () => {
    task = new Task('20230519-l2-gauge-checkpointer', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    L2GaugeCheckpointer = await task.deployedInstance('L2GaugeCheckpointer');
  });

  before('setup contracts', async () => {
    const vaultTask = new Task('20210418-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');
  });

  before('get authorizer wrapper', async () => {
    const authorizerWrapperTask = new Task('20230414-authorizer-wrapper', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizerWrapper = await authorizerWrapperTask.deployedInstance('AuthorizerWithAdaptorValidation');

    const adaptorEntrypointTask = new Task('20221124-authorizer-adaptor-entrypoint', TaskMode.READ_ONLY, 'mainnet');
    adaptorEntrypoint = await adaptorEntrypointTask.deployedInstance('AuthorizerAdaptorEntrypoint');
  });

  before('start using authorizer wrapper', async () => {
    // At this block height, the authorizer wrapper was already deployed but not connected to the vault.
    // Therefore, we do that last step as part of the fork test. No extra permissions are needed, since the wrapper
    // uses the existing authorizer under the hood; it just adds compatibility with the authorizer adaptor entrypoint.
    daoMultisig = await impersonate(DAO_MULTISIG, fp(100));

    await authorizer.connect(daoMultisig).grantRole(await actionId(vault, 'setAuthorizer'), daoMultisig.address);
    await vault.connect(daoMultisig).setAuthorizer(authorizerWrapper.address);
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

  before('add gauges to checkpointer', async () => {
    await Promise.all(
      Array.from(gauges).map(([gaugeType, gaugesData]) => {
        L2GaugeCheckpointer.addGauges(
          gaugeType,
          gaugesData.map((gaugeData) => gaugeData.address)
        );
      })
    );
  });

  before('grant checkpoint permission to fees gauge checkpointer', async () => {
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
      expect(await L2GaugeCheckpointer.getTotalGauges(gaugeType)).to.be.eq(gaugesData.length);
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

  describe('checkpoint', () => {
    sharedBeforeEach(async () => {
      // Gauges that are above a threshold will get another checkpoint attempt when the threshold is lowered.
      // This block takes a snapshot so that gauges can be repeatedly checkpointed without skipping.
    });

    context('when threshold is 1', () => {
      itCheckpointsGaugesAboveRelativeWeight(fp(1), 0);
    });

    context('when threshold is 0.0001', () => {
      itCheckpointsGaugesAboveRelativeWeight(fp(0.0001), 22);
    });

    context('when threshold is 0', () => {
      itCheckpointsGaugesAboveRelativeWeight(fp(0), 31);
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
              GaugeType.Ethereum,
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
              GaugeType.Polygon,
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
              GaugeType.Arbitrum,
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
              GaugeType.Optimism,
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
              GaugeType.Gnosis,
              minRelativeWeight
            );
            return await tx.wait();
          };
          gaugeDataAboveMinWeight = gnosisGaugeDataAboveMinWeight;
        });

        itPerformsCheckpoint();
      });

      function itPerformsCheckpoint() {
        const checkpointInterface = new ethers.utils.Interface([
          'function checkpoint()',
          'event Checkpoint(uint256 indexed periodTime, uint256 periodEmissions)',
        ]);

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
  });

  function getGaugeDataAboveMinWeight(gaugeType: GaugeType, fpMinRelativeWeight: BigNumber): GaugeData[] {
    return gauges.get(gaugeType)!.filter((addressWeight) => addressWeight.weight.gte(fpMinRelativeWeight));
  }
});
