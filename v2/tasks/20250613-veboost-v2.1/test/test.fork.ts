import hre from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { expect } from 'chai';

import { actionId } from '@helpers/models/misc/actions';

import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode } from '@src';

import { VeBoostV21Deployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { bn } from '@helpers/numbers';
import { currentTimestamp, WEEK } from '@helpers/time';
import { ZERO_ADDRESS } from '@helpers/constants';

describeForkTest('VeBoostV2', 'mainnet', 22668480, function () {
  let oldBoost: Contract;
  let newBoost: Contract;
  let delegationProxy: Contract;
  let votingEscrow: Contract;

  let govMultisig: SignerWithAddress;
  let currentTime: BigNumber;

  let input: VeBoostV21Deployment;
  let task: Task;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  before('run task', async () => {
    task = new Task('20250613-veboost-v2.1', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    newBoost = await task.deployedInstance('VeBoostV2');
  });

  before('set up contracts', async () => {
    input = task.input() as VeBoostV21Deployment;
    oldBoost = await task.instanceAt('VeBoostV2', input.VeBoostV2);

    const votingEscrowTask = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, getForkedNetwork(hre));
    votingEscrow = await votingEscrowTask.deployedInstance('VotingEscrow');

    const veDelegationProxyTask = new Task('20220325-ve-delegation', TaskMode.READ_ONLY, getForkedNetwork(hre));
    delegationProxy = await veDelegationProxyTask.deployedInstance('VotingEscrowDelegationProxy');

    currentTime = await currentTimestamp();
  });

  before('set permissions', async () => {
    const authorizer = await new Task(
      '20210418-authorizer',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    ).deployedInstance('Authorizer');

    govMultisig = await impersonate(GOV_MULTISIG);
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(delegationProxy, 'setDelegation'), govMultisig.address);
  });

  it('proxy can be migrated to delegation', async () => {
    expect(await delegationProxy.getDelegationImplementation()).to.be.eq(oldBoost.address);

    await newBoost.migrate();
    await delegationProxy.connect(govMultisig).setDelegation(newBoost.address);

    expect(await delegationProxy.getDelegationImplementation()).to.be.eq(newBoost.address);
  });

  it('adjusted balances should be unchanged after migration', async () => {
    const uniqueAddresses = new Set(input.PreseededBoostCalls.flatMap((call) => [call.from, call.to]));

    // They change every second, so I can't store the old balances through the delegation proxy.
    // This is the only way to compute them at the same timestamp.
    // The proxy call literally just forwards to the same function in the boost, so this is equivalent.
    for (const address of uniqueAddresses) {
      const oldBalance = await oldBoost.adjusted_balance_of(address);
      const newBalance = await newBoost.adjusted_balance_of(address);

      expect(newBalance).to.eq(oldBalance);
    }
  });

  it('total supply should be unchanged after migration', async () => {
    const oldSupply = await oldBoost.totalSupply();
    const newSupply = await newBoost.totalSupply();

    expect(newSupply).to.eq(oldSupply);
  });

  it('should allow creating boosts from Tetu operator', async () => {
    const { operator, delegator } = input.PreseededApprovalCalls[0];

    const currentOperator = await impersonate(operator);

    const endTime = await computeValidEndTime(delegator);
    const amount = await computeValidAmount(delegator);

    await validateBoostAssumptions(currentOperator.address, delegator, amount, endTime);

    const operatorBalanceBefore = await newBoost.adjusted_balance_of(currentOperator.address);
    expect(operatorBalanceBefore).to.eq(0);

    // Calls _boost(from: delegator, to: operator, amount: 1, end_time: endTime)
    const boostMethod = newBoost.connect(currentOperator)['boost(address,uint256,uint256,address)'];
    await boostMethod(currentOperator.address, amount, endTime, delegator);

    const operatorBalanceAfter = await newBoost.adjusted_balance_of(currentOperator.address);
    expect(operatorBalanceAfter).to.be.almostEqual(amount);
  });

  it('should allow creating boosts from StakeDAO operator', async () => {
    const { operator, delegator } = input.PreseededApprovalCalls[1];

    const currentOperator = await impersonate(operator);

    const endTime = await computeValidEndTime(delegator);
    const amount = await computeValidAmount(delegator);

    await validateBoostAssumptions(currentOperator.address, delegator, amount, endTime);

    const operatorBalanceBefore = await newBoost.adjusted_balance_of(currentOperator.address);
    expect(operatorBalanceBefore).to.eq(0);

    // Should not revert.
    const boostMethod = newBoost.connect(currentOperator)['boost(address,uint256,uint256,address)'];
    await boostMethod(currentOperator.address, amount, endTime, delegator);

    const operatorBalanceAfter = await newBoost.adjusted_balance_of(currentOperator.address);
    expect(operatorBalanceAfter).to.be.almostEqual(amount);
  });

  it('should not allow crossing the streams', async () => {
    const { operator } = input.PreseededApprovalCalls[0];
    const { delegator } = input.PreseededApprovalCalls[1];

    const currentOperator = await impersonate(operator);

    const endTime = await computeValidEndTime(delegator);
    const amount = await computeValidAmount(delegator);

    await validateBoostAssumptions(currentOperator.address, delegator, amount, endTime);

    const boostMethod = newBoost.connect(currentOperator)['boost(address,uint256,uint256,address)'];

    // Should revert.
    await expect(boostMethod(currentOperator.address, amount, endTime, delegator)).to.be.reverted;
  });

  async function computeValidEndTime(delegator: string): Promise<BigNumber> {
    const endOfLockPeriod = await votingEscrow.locked__end(delegator);
    expect(endOfLockPeriod).to.be.gt(currentTime);

    // Has to be on a week boundary in the future, but earlier than the end of the lock.
    return endOfLockPeriod.sub(bn(WEEK));
  }

  async function validateBoostAssumptions(
    operator: string,
    delegator: string,
    amount: BigNumber,
    endTime: BigNumber
  ): Promise<void> {
    // Validate boost assumptions
    expect(operator).to.not.eq(ZERO_ADDRESS);
    expect(operator).to.not.eq(delegator);
    expect(amount).to.be.gt(0);
    expect(endTime).to.be.gt(currentTime);
    expect(endTime.toNumber() % WEEK).to.eq(0);

    const veLockedEnd = await votingEscrow.locked__end(delegator);
    expect(endTime).to.be.lte(veLockedEnd);
  }

  async function computeValidAmount(delegator: string): Promise<BigNumber> {
    const balance = await votingEscrow['balanceOf(address)'](delegator);

    return balance.div(2);
  }
});
