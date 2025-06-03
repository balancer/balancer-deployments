import hre from 'hardhat';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';

describeForkTest('QuantAMMPool', 'sepolia', 8140847, function () {
  let task: Task;

  const TASK_NAME = '20250513-v3-sonic-oraclewrapper';

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
  });

  it('deploys oracle', async () => {
    await task.deployedInstance('ChainlinkOracle');
  });
});
