import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { BigNumber, fp, FP_ONE } from '@helpers/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { advanceTime, currentTimestamp, currentWeekTimestamp, DAY, MONTH, WEEK } from '@helpers/time';
import * as expectEvent from '@helpers/expectEvent';

import { expectEqualWithError } from '@helpers/relativeError';
import { MAX_UINT256, ZERO_ADDRESS } from '@helpers/constants';
import { range } from 'lodash';
import { expectTransferEvent } from '@helpers/expectTransfer';
import { actionId } from '@helpers/models/misc/actions';

import { describeForkTest, getSigner, impersonate, getForkedNetwork, Task, TaskMode } from '@src';
import { WeightedPoolEncoder } from '@helpers/models/pools/weighted/encoder';

describeForkTest('FraxtalRootGaugeFactory', 'mainnet', 19928000, function () {
  let veBALHolder: SignerWithAddress,
    admin: SignerWithAddress,
    recipient: SignerWithAddress,
    daoMultisig: SignerWithAddress;
  let factory: Contract, gauge: Contract;
  let vault: Contract,
    authorizer: Contract,
    adaptorEntrypoint: Contract,
    BALTokenAdmin: Contract,
    gaugeController: Contract,
    gaugeAdder: Contract;
  let veBAL: Contract, bal80weth20Pool: Contract;
  let BAL: string;

  let task: Task;
  let fraxtalBAL: string;
  let fraxtalL1Bridge: string;
  let gasLimit: BigNumber;

  const DAO_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
  const VEBAL_POOL = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56';
  const VAULT_BOUNTY = fp(1000);
  const BRIDGE_INTERFACE = new ethers.utils.Interface([
    'event ERC20DepositInitiated(address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _data)',
  ]);

  const weightCap = fp(0.001);

  before('run task', async () => {
    task = new Task('20240522-fraxtal-root-gauge-factory', TaskMode.TEST, getForkedNetwork(hre));
    ({ FraxtalBAL: fraxtalBAL, L1StandardBridge: fraxtalL1Bridge, GasLimit: gasLimit } = task.input());
    await task.run({ force: true });
    factory = await task.deployedInstance('OptimisticRootGaugeFactory');
  });

  before('advance time', async () => {
    // This causes all voting cooldowns to expire, letting the veBAL holder vote again
    await advanceTime(DAY * 12);
  });

  before('setup accounts', async () => {
    admin = await getSigner(0);
    recipient = await getSigner(1);

    daoMultisig = await impersonate(DAO_MULTISIG, fp(100));
    // Since the veBAL holder is synthetic, we do not need to start the test advancing the time to reset the voting
    // power. Moreover, since the block number is close to the present at this point, advancing days breaks the first
    // weight check for the gauge (i.e. before the very first gauge checkpoint), which would make the 'bridge & mint'
    // test unnecessarily complex later on.
    //
    // Specifically, `gauge_relative_weight` returns 0 before the first gauge checkpoint, even when there are votes,
    // which would cause the "vote for gauge" test to fail: and we cannot checkpoint it manually there, since the next
    // "mint and bridge" needs to test for zero emissions and do its own checkpoint.
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

    // Verify non-zero veBAL balance
    const now = await currentTimestamp();
    expect(await veBAL['balanceOf(address,uint256)'](veBALHolder.address, now)).to.gt(0);
  });

  it('can create a gauge', async () => {
    const tx = await factory.create(recipient.address, weightCap);
    const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');

    gauge = await task.instanceAt('OptimisticRootGauge', event.args.gauge);

    expect(await factory.isGaugeFromFactory(gauge.address)).to.be.true;

    // We need to grant permissions to mint in the gauges, which is done via the Authorizer Adaptor Entrypoint
    await authorizer
      .connect(daoMultisig)
      .grantRole(await adaptorEntrypoint.getActionId(gauge.interface.getSighash('checkpoint')), admin.address);
  });

  before('grant permissions on gauge adder', async () => {
    const addGaugeTypeAction = await actionId(gaugeAdder, 'addGaugeType');
    const setFactoryAction = await actionId(gaugeAdder, 'setGaugeFactory');
    const addGaugeAction = await actionId(gaugeAdder, 'addGauge');

    await authorizer.connect(daoMultisig).grantRole(addGaugeTypeAction, admin.address);
    await authorizer.connect(daoMultisig).grantRole(setFactoryAction, admin.address);
    await authorizer.connect(daoMultisig).grantRole(addGaugeAction, admin.address);
  });

  it('add gauge to gauge controller', async () => {
    await gaugeAdder.connect(admin).addGaugeType('Fraxtal');
    await gaugeAdder.connect(admin).setGaugeFactory(factory.address, 'Fraxtal');
    await gaugeAdder.connect(admin).addGauge(gauge.address, 'Fraxtal');

    expect(await gaugeAdder.isGaugeFromValidFactory(gauge.address, 'Fraxtal')).to.be.true;

    expect(await gaugeController.gauge_exists(gauge.address)).to.be.true;
  });

  it('factory stores the gas limit', async () => {
    expect(await factory.getOptimismGasLimit()).to.eq(gasLimit);
  });

  it('stores the recipient', async () => {
    expect(await gauge.getRecipient()).to.eq(recipient.address);
  });

  it('stores the fraxtal bridge', async () => {
    expect(await gauge.getOptimismBridge()).to.eq(fraxtalL1Bridge);
  });

  it('stores fraxtal BAL', async () => {
    expect(await gauge.getOptimismBal()).to.eq(fraxtalBAL);
  });

  it('returns the correct network tag', async () => {
    expect(await gauge.NETWORK()).to.eq('Fraxtal');
  });

  it('vote for gauge', async () => {
    expect(await gaugeController.get_gauge_weight(gauge.address)).to.equal(0);
    expect(await gauge.getCappedRelativeWeight(await currentTimestamp())).to.equal(0);

    await gaugeController.connect(veBALHolder).vote_for_gauge_weights(gauge.address, 10000); // Max voting power is 10k points

    // We now need to go through an epoch for the votes to be locked in.
    // Advancing 7 days ensures we don't move forward 2 entire epochs, which would complicate the math ahead.
    await advanceTime(DAY * 7);

    await gaugeController.checkpoint();
    // Gauge weight is equal to the cap, and controller weight for the gauge is greater than the cap.
    expect(
      await gaugeController['gauge_relative_weight(address,uint256)'](gauge.address, await currentWeekTimestamp())
    ).to.be.gt(weightCap);
    expect(await gauge.getCappedRelativeWeight(await currentTimestamp())).to.equal(weightCap);
  });

  it('mint & bridge tokens', async () => {
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

    const bridgeCost = await gauge.getTotalBridgeCost();

    // The gauge should now mint and send all minted tokens to the Fraxtal bridge
    const mintReceipt = await (
      await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata, { value: bridgeCost })
    ).wait();

    const event = expectEvent.inIndirectReceipt(mintReceipt, gauge.interface, 'Checkpoint', {
      periodTime: firstMintWeekTimestamp,
    });
    const actualEmissions: BigNumber = event.args.periodEmissions;

    // The amount of tokens minted should equal the weekly emissions rate times the relative weight of the gauge
    const weeklyRate = (await BALTokenAdmin.getInflationRate()).mul(WEEK);

    // Note that instead of the weight, we use the cap (since we expect for the weight to be larger than the cap)
    const expectedEmissions = weightCap.mul(weeklyRate).div(FP_ONE);
    expectEqualWithError(actualEmissions, expectedEmissions, 0.001);

    // Tokens are minted for the gauge
    expectTransferEvent(
      mintReceipt,
      {
        from: ZERO_ADDRESS,
        to: gauge.address,
        value: actualEmissions,
      },
      BAL
    );

    // And the gauge then deposits those via the bridge mechanism
    expectTransferEvent(
      mintReceipt,
      {
        from: gauge.address,
        to: fraxtalL1Bridge,
        value: actualEmissions,
      },
      BAL
    );

    expectEvent.inIndirectReceipt(mintReceipt, BRIDGE_INTERFACE, 'ERC20DepositInitiated', {
      _l1Token: BAL,
      _l2Token: fraxtalBAL,
      _from: gauge.address,
      _to: recipient.address,
      _amount: actualEmissions,
    });
  });

  it('mint multiple weeks', async () => {
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

    const bridgeCost = await gauge.getTotalBridgeCost();
    const calldata = gauge.interface.encodeFunctionData('checkpoint');
    const tx = await adaptorEntrypoint.connect(admin).performAction(gauge.address, calldata, { value: bridgeCost });
    const receipt = await tx.wait();

    await Promise.all(
      range(1, numberOfWeeks + 1).map(async (weekIndex) =>
        expectEvent.inIndirectReceipt(receipt, gauge.interface, 'Checkpoint', {
          periodTime: weekTimestamp.sub(WEEK * weekIndex),
        })
      )
    );

    // Tokens are minted for the gauge
    const transferEvent = expectTransferEvent(
      receipt,
      {
        from: ZERO_ADDRESS,
        to: gauge.address,
      },
      BAL
    );

    const actualEmissions = transferEvent.args.value;
    expect(actualEmissions).to.be.almostEqual(expectedEmissions, 0.00001);

    // And the gauge then deposits those via the bridge mechanism
    expectTransferEvent(
      receipt,
      {
        from: gauge.address,
        to: fraxtalL1Bridge,
        value: actualEmissions,
      },
      BAL
    );

    expectEvent.inIndirectReceipt(receipt, BRIDGE_INTERFACE, 'ERC20DepositInitiated', {
      _l1Token: BAL,
      _l2Token: fraxtalBAL,
      _from: gauge.address,
      _to: recipient.address,
      _amount: actualEmissions,
    });
  });
});
