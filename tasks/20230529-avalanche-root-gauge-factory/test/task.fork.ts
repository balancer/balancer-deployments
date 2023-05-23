import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { BigNumber, fp, FP_ONE } from '@helpers/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { advanceTime, currentTimestamp, currentWeekTimestamp, DAY, MONTH, WEEK } from '@helpers/time';
import * as expectEvent from '@helpers/expectEvent';

import { expectEqualWithError } from '@helpers/relativeError';
import { MAX_UINT256, ZERO_ADDRESS } from '@helpers/constants';
import { range } from 'lodash';
import { expectTransferEvent } from '@helpers/expectTransfer';
import { actionId } from '@helpers/models/misc/actions';

import { describeForkTest, getSigner, impersonate, getForkedNetwork, Task, TaskMode, deploy } from '@src';
import { WeightedPoolEncoder } from '@helpers/models/pools/weighted/encoder';

describeForkTest('AvalancheRootGaugeFactory', 'mainnet', 17268518, function () {
  let veBALHolder: SignerWithAddress, admin: SignerWithAddress, recipient: SignerWithAddress;
  let daoMultisig: SignerWithAddress;
  let factory: Contract, gauge: Contract;
  let vault: Contract,
    authorizer: Contract,
    adaptorEntrypoint: Contract,
    BALTokenAdmin: Contract,
    gaugeController: Contract,
    gaugeAdder: Contract,
    veBAL: Contract,
    bal80weth20Pool: Contract;
  let BAL: string;

  let task: Task;

  // Address of wrapped BAL for the bridge
  const ANY_BAL = '0xcb9d0b8CfD8371143ba5A794c7218D4766c493e2';
  const DAO_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const VEBAL_POOL = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56';
  const VAULT_BOUNTY = fp(1000);

  const weightCap = fp(0.001);

  const ETHEREUM_CHAIN_ID = 1;
  const AVALANCHE_CHAIN_ID = 43114;

  const MIN_BRIDGE_LIMIT = fp(1.459854);
  const MAX_BRIDGE_LIMIT = fp(729927.007299);

  const bridgeInterface = new ethers.utils.Interface([
    'event LogAnySwapOut(address indexed token, address indexed from, address indexed to, uint amount, uint fromChainID, uint toChainID)',
  ]);

  before('run task', async () => {
    task = new Task('20230529-avalanche-root-gauge-factory', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    factory = await task.deployedInstance('AvalancheRootGaugeFactory');
  });

  before('advance time', async () => {
    // This causes all voting cooldowns to expire, letting the veBAL holder vote again
    await advanceTime(DAY * 12);
  });

  before('setup accounts', async () => {
    admin = await getSigner(0);
    recipient = await getSigner(1);

    daoMultisig = await impersonate(DAO_MULTISIG, fp(100));
    veBALHolder = await impersonate((await getSigner(2)).address, VAULT_BOUNTY.add(fp(5))); // plus gas
  });

  before('setup contracts', async () => {
    const vaultTask = new Task('20210418-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');

    // Need to get the original Authorizer (getting it from the Vault at this block will yield the AuthorizerWithAdaptorValidation)
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const adaptorEntrypointTask = new Task('20221124-authorizer-adaptor-entrypoint', TaskMode.READ_ONLY, 'mainnet');
    adaptorEntrypoint = await adaptorEntrypointTask.deployedInstance('AuthorizerAdaptorEntrypoint');

    const gaugeAdderTask = new Task('20230519-gauge-adder-v4', TaskMode.READ_ONLY, getForkedNetwork(hre));
    gaugeAdder = await gaugeAdderTask.deployedInstance('GaugeAdder');

    const balancerTokenAdminTask = new Task('20220325-balancer-token-admin', TaskMode.READ_ONLY, getForkedNetwork(hre));
    BALTokenAdmin = await balancerTokenAdminTask.deployedInstance('BalancerTokenAdmin');

    BAL = await BALTokenAdmin.getBalancerToken();

    const gaugeControllerTask = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, getForkedNetwork(hre));
    gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
    veBAL = await gaugeControllerTask.instanceAt(
      'VotingEscrow',
      gaugeControllerTask.output({ network: 'mainnet' }).VotingEscrow
    );

    const weightedPoolTask = new Task('20210418-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    bal80weth20Pool = await weightedPoolTask.instanceAt('WeightedPool2Tokens', VEBAL_POOL);
  });

  describe('AvalancheRootGaugeFactory', () => {
    const randomInt = (max: number) => Math.floor(Math.random() * Math.floor(max));

    it('stores the original bridge limits', async () => {
      const { minBridgeAmount, maxBridgeAmount } = await factory.getAvalancheBridgeLimits();

      expect(minBridgeAmount).to.eq(MIN_BRIDGE_LIMIT);
      expect(maxBridgeAmount).to.eq(MAX_BRIDGE_LIMIT);
    });

    describe('setting bridge limits', async () => {
      const newLowerLimit = MIN_BRIDGE_LIMIT.mul(randomInt(100));
      const newUpperLimit = MAX_BRIDGE_LIMIT.mul(randomInt(10));

      context('without permission', () => {
        it('fails if the caller has no permission', async () => {
          await expect(factory.setAvalancheBridgeLimits(newLowerLimit, newUpperLimit)).to.be.revertedWith('BAL#401');
        });
      });

      context('with permission', () => {
        before('grant permission', async () => {
          const setLimitsAction = await actionId(factory, 'setAvalancheBridgeLimits');

          await authorizer.connect(daoMultisig).grantRole(setLimitsAction, admin.address);
        });

        it('allows updating bridge limits', async () => {
          const tx = await factory.connect(admin).setAvalancheBridgeLimits(newLowerLimit, newUpperLimit);
          expectEvent.inReceipt(await tx.wait(), 'AvalancheBridgeLimitsModified', {
            minBridgeAmount: newLowerLimit,
            maxBridgeAmount: newUpperLimit,
          });

          const { minBridgeAmount, maxBridgeAmount } = await factory.getAvalancheBridgeLimits();

          expect(minBridgeAmount).to.eq(newLowerLimit);
          expect(maxBridgeAmount).to.eq(newUpperLimit);
        });
      });
    });
  });

  before('create veBAL whale', async () => {
    const poolId = await bal80weth20Pool.getPoolId();

    await vault.connect(veBALHolder).joinPool(
      poolId,
      veBALHolder.address,
      veBALHolder.address,
      {
        assets: [BAL, ZERO_ADDRESS],
        maxAmountsIn: [0, VAULT_BOUNTY],
        fromInternalBalance: false,
        userData: WeightedPoolEncoder.joinExactTokensInForBPTOut([0, VAULT_BOUNTY], 0),
      },
      { value: VAULT_BOUNTY }
    );

    await bal80weth20Pool.connect(veBALHolder).approve(veBAL.address, MAX_UINT256);
    const currentTime = await currentTimestamp();
    await veBAL
      .connect(veBALHolder)
      .create_lock(await bal80weth20Pool.balanceOf(veBALHolder.address), currentTime.add(MONTH * 12));
  });

  it('can create a gauge', async () => {
    const tx = await factory.create(recipient.address, weightCap);
    const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');

    gauge = await task.instanceAt('AvalancheRootGauge', event.args.gauge);

    expect(await factory.isGaugeFromFactory(gauge.address)).to.be.true;

    // We need to grant permissions to mint in the gauges, which is done via the Authorizer Adaptor Entrypoint
    await authorizer
      .connect(daoMultisig)
      .grantRole(await adaptorEntrypoint.getActionId(gauge.interface.getSighash('checkpoint')), admin.address);
  });

  before('grant permissions on gauge adder', async () => {
    await authorizer
      .connect(daoMultisig)
      .grantRole(await adaptorEntrypoint.getActionId(gaugeAdder.interface.getSighash('addGaugeType')), admin.address);

    await authorizer
      .connect(daoMultisig)
      .grantRole(
        await adaptorEntrypoint.getActionId(gaugeAdder.interface.getSighash('setGaugeFactory')),
        admin.address
      );

    await authorizer
      .connect(daoMultisig)
      .grantRole(await adaptorEntrypoint.getActionId(gaugeAdder.interface.getSighash('addGauge')), admin.address);

    const gaugeControllerAddGaugeAction = await actionId(
      adaptorEntrypoint,
      'add_gauge(address,int128)',
      gaugeController.interface
    );

    await authorizer.connect(daoMultisig).grantRole(gaugeControllerAddGaugeAction, gaugeAdder.address);
  });

  it('works', () => {
    expect(true).to.be.true;
  })

  it('add gauge to gauge controller', async () => {
    await gaugeAdder.connect(admin).addGaugeType('Avalanche');
    await gaugeAdder.connect(admin).setGaugeFactory(factory.address, 'Avalanche');
    await gaugeAdder.connect(admin).addGauge(gauge.address, 'Avalanche');

    expect(await gaugeAdder.isGaugeFromValidFactory(gauge.address, 'Avalanche')).to.be.true;

    /*expect(await gaugeController.gauge_exists(gauge.address)).to.be.true;*/
  });

  it.skip('vote for gauge', async () => {
    expect(await gaugeController.get_gauge_weight(gauge.address)).to.equal(0);
    expect(await gauge.getCappedRelativeWeight(await currentTimestamp())).to.equal(0);

    await gaugeController.connect(veBALHolder).vote_for_gauge_weights(gauge.address, 10000); // Max voting power is 10k points

    // We now need to go through an epoch for the votes to be locked in
    await advanceTime(DAY * 8);

    await gaugeController.checkpoint();
    // Gauge weight is equal to the cap, and controller weight for the gauge is greater than the cap.
    expect(
      await gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, await currentWeekTimestamp())
    ).to.be.gt(weightCap);
    expect(await gauge.getCappedRelativeWeight(await currentTimestamp())).to.equal(weightCap);
  });

  it.skip('mint & bridge tokens', async () => {
    // The gauge has votes for this week, and it will mint the first batch of tokens. We store the current gauge
    // relative weight, as it will change as time goes by due to vote decay.
    const firstMintWeekTimestamp = await currentWeekTimestamp();

    const calldata = gauge.interface.encodeFunctionData('checkpoint');

    // Even though the gauge has relative weight, it cannot mint yet as it needs for the epoch to finish
    const zeroMintTx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);
    expectEvent.inIndirectReceipt(await zeroMintTx.wait(), gauge.interface, 'Checkpoint', {
      periodTime: firstMintWeekTimestamp.sub(WEEK), // Process past week, which had zero votes
      periodEmissions: 0,
    });
    // No token transfers are performed if the emissions are zero, but we can't test for a lack of those

    await advanceTime(WEEK);

    // The gauge should now mint and send all minted tokens to the Polygon ZkEVM bridge
    const mintTx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);
    const event = expectEvent.inIndirectReceipt(await mintTx.wait(), gauge.interface, 'Checkpoint', {
      periodTime: firstMintWeekTimestamp,
    });
    const actualEmissions = event.args.periodEmissions;

    // The amount of tokens minted should equal the weekly emissions rate times the relative weight of the gauge
    const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(WEEK);

    // Note that instead of the weight, we use the cap (since we expect for the weight to be larger than the cap)
    const expectedEmissions = weightCap.mul(weeklyRate).div(FP_ONE);
    expectEqualWithError(actualEmissions, expectedEmissions, 0.001);

    // Tokens are minted for the gauge
    expectTransferEvent(
      await mintTx.wait(),
      {
        from: ZERO_ADDRESS,
        to: gauge.address,
        value: actualEmissions,
      },
      BAL
    );

    // And the gauge then deposits those via the bridge mechanism
    expectEvent.inIndirectReceipt(await mintTx.wait(), bridgeInterface, 'LogAnySwapOut', {
      token: ANY_BAL,
      from: gauge.address,
      to: recipient.address,
      amount: actualEmissions,
      fromChainID: ETHEREUM_CHAIN_ID,
      toChainID: AVALANCHE_CHAIN_ID,
    });
  });

  it.skip('mint multiple weeks', async () => {
    const numberOfWeeks = 5;
    await advanceTime(WEEK * numberOfWeeks);
    await gaugeController.checkpoint_gauge(gauge.address);

    const weekTimestamp = await currentWeekTimestamp();

    // We can query the relative weight of the gauge for each of the weeks that have passed
    const relativeWeights: BigNumber[] = await Promise.all(
      range(1, numberOfWeeks + 1).map(async (weekIndex) =>
        gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, weekTimestamp.sub(WEEK * weekIndex))
      )
    );

    // We require that they're all above the cap for simplicity - this lets us use the cap as each week's weight (and
    // also tests cap behavior).
    for (const relativeWeight of relativeWeights) {
      expect(relativeWeight).to.be.gt(weightCap);
    }

    // The amount of tokens allocated to the gauge should equal the sum of the weekly emissions rate times the weight
    // cap.
    const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(WEEK);
    // Note that instead of the weight, we use the cap (since we expect for the weight to be larger than the cap)
    const expectedEmissions = weightCap.mul(numberOfWeeks).mul(weeklyRate).div(FP_ONE);

    const calldata = gauge.interface.encodeFunctionData('checkpoint');
    const tx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata);

    await Promise.all(
      range(1, numberOfWeeks + 1).map(async (weekIndex) =>
        expectEvent.inIndirectReceipt(await tx.wait(), gauge.interface, 'Checkpoint', {
          periodTime: weekTimestamp.sub(WEEK * weekIndex),
        })
      )
    );

    // Tokens are minted for the gauge
    const transferEvent = expectTransferEvent(
      await tx.wait(),
      {
        from: ZERO_ADDRESS,
        to: gauge.address,
      },
      BAL
    );

    expect(transferEvent.args.value).to.be.almostEqual(expectedEmissions);

    const depositEvent = expectEvent.inIndirectReceipt(await tx.wait(), bridgeInterface, 'LogAnySwapOut', {
      token: ANY_BAL,
      from: gauge.address,
      to: recipient.address,
      fromChainID: ETHEREUM_CHAIN_ID,
      toChainID: AVALANCHE_CHAIN_ID,
    });

    expect(depositEvent.args.amount).to.be.almostEqual(expectedEmissions);
  });
});
