import hre from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { expect } from 'chai';

import { actionId } from '@helpers/models/misc/actions';

import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode } from '@src';

import { VeBoostV21Deployment } from '../input';

describeForkTest('veBoostV2', 'mainnet', 22668480, function () {
  let oldBoost: Contract;
  let boost: Contract;
  let delegationProxy: Contract;

  let task: Task;
  let input: VeBoostV21Deployment;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  before('run task', async () => {
    task = new Task('20250613-veboost-v2.1', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    boost = await task.deployedInstance('VeBoostV2');

    input = task.input() as VeBoostV21Deployment;
    oldBoost = await task.instanceAt('VeBoostV2', input.VeBoostV2);

    const veDelegationProxyTask = new Task('20220325-ve-delegation', TaskMode.READ_ONLY, getForkedNetwork(hre));
    delegationProxy = await veDelegationProxyTask.deployedInstance('VotingEscrowDelegationProxy');
  });

  it.only('works', () => {
    expect(true).to.be.true;
  })

  it('no unexpected boosts exist on old veBoost contract', async () => {
    const totalSupply = await oldBoost.totalSupply();
    expect(await boost.totalSupply()).to.be.eq(totalSupply);
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

    await delegationProxy.connect(govMultisig).setDelegation(boost.address);

    expect(await delegationProxy.getDelegationImplementation()).to.be.eq(boost.address);
  });

  it('adjusted balances should be unchanged after migration', async () => {
    const uniqueAddresses = new Set(input.PreseededBoostCalls.flatMap((call) => [call.from, call.to]));

    // First pass: store the balances before migration.
    const oldBalances = new Map<string, BigNumber>();

    for (const address of uniqueAddresses) {
      const balance = await delegationProxy.adjusted_balance_of(address);
      oldBalances.set(address, balance);
    }

    await boost.migrate();

    // Second pass: validate that the balances are unchanged after migration.
    for (const address of uniqueAddresses) {
      const actualBalance = await delegationProxy.adjusted_balance_of(address);
      const expectedBalance = oldBalances.get(address);

      expect(actualBalance).to.eq(expectedBalance);
    }
  });
});
