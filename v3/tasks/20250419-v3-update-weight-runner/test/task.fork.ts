import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ZERO_ADDRESS } from '@helpers/constants';
import { QuantAMMDeploymentInputParams } from '../input';

describeForkTest('QuantAMMPool', 'sepolia', 8140847, function () {
  let task: Task;
  let accounts: SignerWithAddress[];
  let sender: SignerWithAddress;
  let admin: string;
  let updateWeightRunner: Contract;
  let input: QuantAMMDeploymentInputParams;

  const TASK_NAME = '20250419-v3-update-weight-runner';

  before('run task', async () => {
    accounts = await hre.ethers.getSigners();
    sender = accounts[0];
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    updateWeightRunner = await task.deployedInstance('UpdateWeightRunner');
    input = task.input() as QuantAMMDeploymentInputParams;

    if (!input.QuantAMMAdmin || input.QuantAMMAdmin == ZERO_ADDRESS) {
      admin = sender.address;
    }
  });

  it('checks the admin variable', async () => {
    expect(await updateWeightRunner.quantammAdmin()).to.be.eq(admin);
  });

  it('checks the eth oracle', async () => {
    expect(await updateWeightRunner.ethOracle()).to.be.eq(input.ChainlinkFeedETH);
  });
});
