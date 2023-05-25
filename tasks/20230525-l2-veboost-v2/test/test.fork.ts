import hre from 'hardhat';
import { BigNumber, Contract } from 'ethers';
import { expect } from 'chai';

import { ZERO_ADDRESS } from '@helpers/constants';

import { actionId } from '@helpers/models/misc/actions';

import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode } from '@src';
import { bn } from '@helpers/numbers';

describeForkTest('L2VeBoostV2', 'arbitrum', 94139000, function () {
  let delegation: Contract, delegationProxy: Contract, authorizer: Contract;

  let task: Task;

  const GOV_MULTISIG = '0xaF23DC5983230E9eEAf93280e312e57539D098D0';
  const VEBAL_HOLDER = '0xA2e7002E0FFC42e4228292D67C13a81FDd191870';

  // To verify that all the components (`VotingEscrowDelegationProxy`, `VeBoostV2` and `OmniVotingEscrowChild`) are
  // interacting properly, two messages were sent from mainnet to Arbitrum before the fork test's block number:
  // one for the total supply, and one for the balance of a veBAL holder.

  // These messages were the only ones to reach the `OmniVotingEscrowChild` up to this point; this can be verified
  // in the nonces shown in the `layerzeroscan` links below.
  // The veBAL balances for every other account that is not the transferred one should be 0.

  // OmniVotingEscrow `sendTotalSupply` tx: https://etherscan.io/tx/0x7ff2dc7000f167323ccfdfb3d84547f6cd5a0bd628a35baf76684aa5aec21e5b
  // LZ total supply transfer:
  // https://layerzeroscan.com/101/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/message/110/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/nonce/1

  // OmniVotingEscrow `sendUserBalance` tx: https://etherscan.io/tx/0x33df7240e54435d805285eec72e25885e7bedaccd3a1a0a56379d96380f31f5f
  // LZ user balance transfer:
  // https://layerzeroscan.com/101/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/message/110/address/0xe241c6e48ca045c7f631600a0f1403b2bfea05ad/nonce/2

  before('run task', async () => {
    task = new Task('20230525-l2-veboost-v2', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    delegation = await task.deployedInstance('VeBoostV2');
  });

  before('setup contracts', async () => {
    const delegationProxyTask = new Task('20230316-l2-ve-delegation-proxy', TaskMode.READ_ONLY, getForkedNetwork(hre));
    delegationProxy = await delegationProxyTask.deployedInstance('VotingEscrowDelegationProxy');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');
  });

  it('returns null V1 delegation', async () => {
    expect(await delegation.BOOST_V1()).to.be.eq(ZERO_ADDRESS);
  });

  it('proxy can be migrated to delegation', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG);
    await authorizer
      .connect(govMultisig)
      .grantRole(await actionId(delegationProxy, 'setDelegation'), govMultisig.address);

    await delegationProxy.connect(govMultisig).setDelegation(delegation.address);

    expect(await delegationProxy.getDelegationImplementation()).to.be.eq(delegation.address);
  });

  it('reverts migrating boosts (nothing to migrate)', async () => {
    await expect(delegation.migrate(bn(0))).to.be.reverted;
  });

  it('gets transferred total supply via delegation proxy', async () => {
    // Exact total supply decays with time, and depends on block time.
    // This is an approximate value fetched from Etherscan at around the time the data was transferred.
    expect(await delegationProxy.totalSupply()).to.be.almostEqual(BigNumber.from('10182868869854932315839099'));
  });

  it('gets transferred user balance via delegation proxy', async () => {
    // Exact user balance decays with time, and depends on block time.
    // This is an approximate value fetched from Etherscan at around the time the data was transferred.
    // Most importantly, it's not 0.
    expect(await delegationProxy.adjustedBalanceOf(VEBAL_HOLDER)).to.be.almostEqual(
      BigNumber.from('11458834346686284')
    );
  });
});
