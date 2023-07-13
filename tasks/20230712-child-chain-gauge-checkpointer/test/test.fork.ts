import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode } from '@src';
import * as expectEvent from '@helpers/expectEvent';

describeForkTest('ChildChainGaugeCheckpointer (BalancerRelayer)', 'polygon', 44244700, function () {
  let task: Task;

  let relayer: Contract, library: Contract;
  let user: SignerWithAddress;

  const gauges = [
    '0x4f23CCC4349E9500d27C7096bD61d203F1D1C1Aa',
    '0x1F0ee42D005b89814a01f050416b28c3142ac900',
    '0x51416C00388bB4644E28546c77AEe768036F17A8',
  ];

  const userAddress = '0x71003c3fe8497d434ff2aea3adda42f2728d8176';
  const version = JSON.stringify({
    name: 'ChildChainGauge checkpointer (BalancerRelayer)',
    version: 5.1,
    deployment: '20230712-child-chain-gauge-checkpointer',
  });

  before('run task', async () => {
    task = new Task('20230712-child-chain-gauge-checkpointer', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    library = await task.deployedInstance('BatchRelayerLibrary');
    relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
  });

  before('load signers', async () => {
    // We impersonate an account that holds staked BPT for the ETH_STETH Pool.
    user = await impersonate(userAddress);
  });

  it('returns correct version', async () => {
    expect(await relayer.version()).to.be.eq(version);
  });

  it('checkpoints gauges for user', async () => {
    const checkpointInterface = new ethers.utils.Interface([
      'event UpdateLiquidityLimit(address indexed _user, uint256 _original_balance, uint256 _original_supply, uint256 _working_balance, uint256 _working_supply)',
    ]);

    const receipt = await (await library.gaugeCheckpoint(user.address, gauges)).wait();
    expectEvent.inIndirectReceipt(receipt, checkpointInterface, 'UpdateLiquidityLimit', {}, gauges[0], 1);
    expectEvent.inIndirectReceipt(receipt, checkpointInterface, 'UpdateLiquidityLimit', {}, gauges[1], 1);
    expectEvent.inIndirectReceipt(receipt, checkpointInterface, 'UpdateLiquidityLimit', {}, gauges[2], 1);
  });
});
