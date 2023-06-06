import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { getForkedNetwork, Task, TaskMode, describeForkTest, getSigners, impersonate, instanceAt } from '@src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';
import { MAX_UINT256, ZERO_ADDRESS } from '@helpers/constants';
import { WeightedPoolEncoder } from '@helpers/models/pools/weighted/encoder';
import { MONTH, currentTimestamp, advanceTime } from '@helpers/time';

describeForkTest('GaugeWorkingBalanceHelper-L1', 'mainnet', 17367389, function () {
  let workingBalanceHelper: Contract;
  let veDelegationProxy: Contract;
  let votingEscrow: Contract;
  let veBALHolder: SignerWithAddress;
  let lpTokenHolder: SignerWithAddress;
  let vault: Contract;
  let gauge: Contract;
  let lpToken: Contract;
  let BAL: string;
  let task: Task;

  const VEBAL_POOL_ID = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
  const VAULT_BOUNTY = fp(1000);

  const LP_TOKEN = '0x7B50775383d3D6f0215A8F290f2C9e2eEBBEceb2';
  const LP_TOKEN_HOLDER = '0x16224283bE3f7C0245d9D259Ea82eaD7fcB8343d';

  const GAUGE = '0x68d019f64a7aa97e2d4e7363aee42251d08124fb';

  const LOCK_PERIOD = MONTH * 12;

  before('run task', async () => {
    task = new Task('20230526-gauge-working-balance-helper', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    workingBalanceHelper = await task.deployedInstance('GaugeWorkingBalanceHelper');
  });

  before('setup accounts', async () => {
    [, veBALHolder] = await getSigners();

    veBALHolder = await impersonate(veBALHolder.address, VAULT_BOUNTY.add(fp(5))); // plus gas
    lpTokenHolder = await impersonate(LP_TOKEN_HOLDER, fp(100));
  });

  before('setup contracts', async () => {
    vault = await new Task('20210418-vault', TaskMode.READ_ONLY, getForkedNetwork(hre)).deployedInstance('Vault');

    veDelegationProxy = await new Task(
      '20220325-ve-delegation',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    ).deployedInstance('VotingEscrowDelegationProxy');

    votingEscrow = await new Task(
      '20220325-gauge-controller',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    ).deployedInstance('VotingEscrow');

    const BALTokenAdmin = await new Task(
      '20220325-balancer-token-admin',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    ).deployedInstance('BalancerTokenAdmin');

    BAL = await BALTokenAdmin.getBalancerToken();

    const gaugeFactoryTask = new Task('20220325-mainnet-gauge-factory', TaskMode.READ_ONLY, getForkedNetwork(hre));
    gauge = await gaugeFactoryTask.instanceAt('LiquidityGaugeV5', GAUGE);

    lpToken = await instanceAt('IERC20', LP_TOKEN);
  });

  before('stake in gauge', async () => {
    const stakeAmount = fp(100);
    await lpToken.connect(lpTokenHolder).transfer(veBALHolder.address, stakeAmount);

    await lpToken.connect(veBALHolder).approve(gauge.address, MAX_UINT256);

    await gauge.connect(veBALHolder)['deposit(uint256)'](stakeAmount);
  });

  describe('getters', () => {
    it('stores the veDelegationProxy', async () => {
      expect(await workingBalanceHelper.getVotingEscrowDelegationProxy()).to.equal(veDelegationProxy.address);
    });

    it('stores the votingEscrow', async () => {
      expect(await workingBalanceHelper.getVotingEscrow()).to.equal(votingEscrow.address);
    });

    it('indicates where to read supply from', async () => {
      expect(await workingBalanceHelper.readsTotalSupplyFromVE()).to.be.true;
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
  });

  context('with veBAL', () => {
    before('create veBAL holder', async () => {
      const [poolAddress] = await vault.getPool(VEBAL_POOL_ID);

      const bal80weth20Pool = await instanceAt('IERC20', poolAddress);

      await vault.connect(veBALHolder).joinPool(
        VEBAL_POOL_ID,
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

      const holderBalance = await bal80weth20Pool.balanceOf(veBALHolder.address);
      await bal80weth20Pool.connect(veBALHolder).approve(votingEscrow.address, MAX_UINT256);

      const currentTime = await currentTimestamp();
      await votingEscrow.connect(veBALHolder).create_lock(holderBalance, currentTime.add(LOCK_PERIOD));
    });

    it(`projected balance should be greater than current`, async () => {
      const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(
        gauge.address,
        veBALHolder.address
      );

      expect(projectedWorkingBalance).to.be.gt(currentWorkingBalance);
    });

    it(`projected ratio should be greater than current`, async () => {
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

    context('decays after veBAL balance decays', () => {
      before(async () => {
        // Because the LP holder owns so few BPT tokens, they get a 2.5 boost even with just a little veBAL. So we don't
        // quite see the effect of the balance decay. We instead test for the extreme case when we're past the locktime,
        // at which point their veBAL balance is zero and there's no boost.
        // Another way of thinking about this is that they got much more veBAL than they needed for the 2.5 boost, so
        // even after it decays there's no real effect.
        await advanceTime(13 * MONTH);
      });

      it('projected balance should be less than current', async () => {
        const [currentWorkingBalance, projectedWorkingBalance] = await workingBalanceHelper.getWorkingBalances(
          gauge.address,
          veBALHolder.address
        );

        expect(projectedWorkingBalance).to.be.lt(currentWorkingBalance);
      });

      it('projected ratio should be less than current', async () => {
        const [currentWorkingRatio, projectedWorkingRatio] = await workingBalanceHelper.getWorkingBalanceToSupplyRatios(
          gauge.address,
          veBALHolder.address
        );

        expect(projectedWorkingRatio).to.be.lt(currentWorkingRatio);
      });
    });
  });
});
