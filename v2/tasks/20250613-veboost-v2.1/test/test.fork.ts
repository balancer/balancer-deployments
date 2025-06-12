import hre from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { expect } from 'chai';

import { actionId } from '@helpers/models/misc/actions';

import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode } from '@src';

import { VeBoostV21Deployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { bn } from '@helpers/numbers';
import { currentTimestamp, MONTH } from '@helpers/time';

describeForkTest('VeBoostV2', 'mainnet', 22668480, function () {
  let oldBoost: Contract;
  let newBoost: Contract;
  let delegationProxy: Contract;
  let operatorAccount: SignerWithAddress;

  let task: Task;
  let input: VeBoostV21Deployment;
  let sixMonthsLater: BigNumber;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  before('run task', async () => {
    task = new Task('20250613-veboost-v2.1', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    newBoost = await task.deployedInstance('VeBoostV2');

    input = task.input() as VeBoostV21Deployment;
    oldBoost = await task.instanceAt('VeBoostV2', input.VeBoostV2);

    const veDelegationProxyTask = new Task('20220325-ve-delegation', TaskMode.READ_ONLY, getForkedNetwork(hre));
    delegationProxy = await veDelegationProxyTask.deployedInstance('VotingEscrowDelegationProxy');

    const currentTime = await currentTimestamp();
    sixMonthsLater = currentTime.add(6 * MONTH);
  });

  it('no unexpected boosts exist on old veBoost contract', async () => {
    const totalSupply = await oldBoost.totalSupply();
    expect(await newBoost.totalSupply()).to.be.eq(totalSupply);
  });

  it('proxy can be migrated to delegation', async () => {
    const authorizer = await new Task(
      '20210418-authorizer',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    ).deployedInstance('Authorizer');

    const govMultisig = await impersonate(GOV_MULTISIG);
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(delegationProxy, 'setDelegation'), govMultisig.address);

    await delegationProxy.connect(govMultisig).setDelegation(newBoost.address);

    expect(await delegationProxy.getDelegationImplementation()).to.be.eq(newBoost.address);
  });

  it('adjusted balances should be unchanged after migration', async () => {
    const uniqueAddresses = new Set(input.PreseededBoostCalls.flatMap((call) => [call.from, call.to]));

    // First pass: store the balances before migration.
    const oldBalances = new Map<string, BigNumber>();

    for (const address of uniqueAddresses) {
      const balance = await delegationProxy.adjusted_balance_of(address);
      oldBalances.set(address, balance);
    }

    await newBoost.migrate();

    // Second pass: validate that the balances are unchanged after migration.
    for (const address of uniqueAddresses) {
      const actualBalance = await delegationProxy.adjusted_balance_of(address);
      const expectedBalance = oldBalances.get(address);

      expect(actualBalance).to.eq(expectedBalance);
    }
  });

  it('should allow creating boosts from Tetu operator', async () => {
    const { operator, delegator } = input.PreseededApprovalCalls[0];
    operatorAccount = await impersonate(operator);

    // Should not revert.
    await newBoost.connect(operatorAccount)['boost(address,uint256,uint256,address)'](operator, bn(1e18), sixMonthsLater, delegator);
  });

  it.only('should allow creating boosts from StakeDAO operator', async () => {
    const { operator, delegator } = input.PreseededApprovalCalls[1];

    operatorAccount = await impersonate(operator);

    // Should not revert.
    await newBoost.connect(operatorAccount)['boost(address,uint256,uint256,address)'](operator, bn(1e18), sixMonthsLater, delegator);
  });
});
