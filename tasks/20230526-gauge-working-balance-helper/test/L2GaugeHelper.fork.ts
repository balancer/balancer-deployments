import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { getForkedNetwork, Task, TaskMode, describeForkTest, getSigners, impersonate, deploy, instanceAt } from '@src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FP_ONE, fp } from '@helpers/numbers';
import { MAX_UINT256 } from '@helpers/constants';
import { MONTH } from '@helpers/time';
import { actionId } from '@helpers/models/misc/actions';

describeForkTest('GaugeWorkingBalanceHelper-L2', 'polygon', 42002545, function () {
  let workingBalanceHelper: Contract;
  let veDelegationProxy: Contract;
  let votingEscrow: Contract;
  let gauge: Contract;
  let authorizer: Contract;
  let lpTokenHolder: SignerWithAddress;
  let other: SignerWithAddress;
  let veBALHolder: SignerWithAddress;
  let lpToken: Contract;

  // Note that at the time of this test, nobody has staked in this gauge.
  const GAUGE = '0x1f0ee42d005b89814a01f050416b28c3142ac900';
  const LP_TOKEN = '0x924ec7ed38080e40396c46f6206a6d77d0b9f72d';
  const LP_TOKEN_HOLDER = '0x9824697f7c12cabada9b57842060931c48dea969';
  const GOV_MULTISIG = '0xeE071f4B516F69a1603dA393CdE8e76C40E5Be85';

  let task: Task;

  before('run task', async () => {
    task = new Task('20230526-gauge-working-balance-helper', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    workingBalanceHelper = await task.deployedInstance('GaugeWorkingBalanceHelper');
  });

  before('setup accounts', async () => {
    [, veBALHolder, other] = await getSigners();

    lpTokenHolder = await impersonate(LP_TOKEN_HOLDER, fp(100));
  });

  before('setup contracts', async () => {
    authorizer = await new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre)).deployedInstance(
      'Authorizer'
    );

    const proxyTask = new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY, getForkedNetwork(hre));
    veDelegationProxy = await proxyTask.deployedInstance('VotingEscrowDelegationProxy');
    votingEscrow = await proxyTask.deployedInstance('NullVotingEscrow');

    const gaugeFactoryTask = new Task(
      '20230316-child-chain-gauge-factory-v2',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    gauge = await gaugeFactoryTask.instanceAt('ChildChainGauge', GAUGE);

    lpToken = await instanceAt('IERC20', LP_TOKEN);
  });

  before('stake in gauge', async () => {
    const stakeAmount = fp(100);
    await lpToken.connect(lpTokenHolder).transfer(veBALHolder.address, stakeAmount);
    await lpToken.connect(veBALHolder).approve(gauge.address, MAX_UINT256);

    await gauge.connect(veBALHolder)['deposit(uint256)'](stakeAmount);

    // We also have `other` stake in the gauge so that the veBALHolder is not the sole gauge staker, and their supply
    // ratio is less than 100%.
    const smallerStakeAmount = stakeAmount.div(2);
    await lpToken.connect(lpTokenHolder).transfer(other.address, smallerStakeAmount);
    await lpToken.connect(other).approve(gauge.address, MAX_UINT256);

    await gauge.connect(other)['deposit(uint256)'](smallerStakeAmount);
  });

  describe('getters (as deployed)', () => {
    it('stores the veDelegationProxy', async () => {
      expect(await workingBalanceHelper.getVotingEscrowDelegationProxy()).to.equal(veDelegationProxy.address);
    });

    it('stores the votingEscrow', async () => {
      expect(await workingBalanceHelper.getVotingEscrow()).to.equal(votingEscrow.address);
    });

    it('indicates where to read supply from', async () => {
      expect(await workingBalanceHelper.readsTotalSupplyFromVE()).to.be.false;
    });
  });

  context('with no veBAL', () => {
    it('projected balance should equal current', async () => {
      const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(
        gauge.address,
        veBALHolder.address
      );

      // Ensure we have equal balances (that are non-zero)
      expect(projectedWorkingBalance).to.eq(currentWorkingBalance);
      expect(projectedWorkingBalance).to.gt(0);
    });

    it('projected ratio should equal current', async () => {
      const [current, projected] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(
        gauge.address,
        veBALHolder.address
      );

      expect(projected).to.eq(current);

      // As a sanity check, we test that they don't own the entire gauge.
      expect(projected).to.be.lt(FP_ONE);
    });
  });

  describe('with veBAL', () => {
    let newVotingEscrow: Contract;

    before('setup contracts', async () => {
      newVotingEscrow = await deploy('MockL2VotingEscrow');

      const admin = await impersonate(GOV_MULTISIG, fp(100));
      await authorizer.connect(admin).grantRole(await actionId(veDelegationProxy, 'setDelegation'), admin.address);
      await veDelegationProxy.connect(admin).setDelegation(newVotingEscrow.address);
    });

    const veBALTotal = fp(1000);

    before('create veBAL whale', async () => {
      // The lock duration is irrelevant because this mock voting escrow doesn't take it into consideration.
      await newVotingEscrow.connect(veBALHolder).create_lock(veBALTotal, MONTH * 12);
    });

    it('shows a veBAL balance', async () => {
      expect(await newVotingEscrow.balanceOf(veBALHolder.address)).to.eq(veBALTotal);
    });

    it(`projected balance should be greater than current`, async () => {
      const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(
        gauge.address,
        veBALHolder.address
      );

      expect(projectedWorkingBalance).to.be.gt(currentWorkingBalance);
    });

    it('projected ratio should be greater than current', async () => {
      const [currentWorkingRatio, projectedWorkingRatio] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(
        gauge.address,
        veBALHolder.address
      );

      expect(projectedWorkingRatio).to.be.gt(currentWorkingRatio);
    });

    context('updates after checkpointing', () => {
      before('checkpoint', async () => {
        await gauge.connect(veBALHolder).user_checkpoint(veBALHolder.address);
      });

      it('projected balance should be equal to or slightly less than current', async () => {
        const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(
          gauge.address,
          veBALHolder.address
        );

        expect(projectedWorkingBalance).to.be.almostEqual(currentWorkingBalance);
        expect(projectedWorkingBalance).to.be.lte(currentWorkingBalance);
      });

      it('projected ratio should be equal to or slightly less than current', async () => {
        const [currentWorkingRatio, projectedWorkingRatio] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(
          gauge.address,
          veBALHolder.address
        );

        expect(projectedWorkingRatio).to.be.almostEqual(currentWorkingRatio);
        expect(projectedWorkingRatio).to.be.lte(currentWorkingRatio);
      });
    });
  });
});
