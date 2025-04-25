import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { fp } from '@helpers/numbers';
import { describeForkTest, getForkedNetwork, Task, TaskMode, impersonate } from '@src';
import { PoolPauseHelperDeployment } from '../input';
import { actionId } from '@helpers/models/misc/actions';

describeForkTest('ProtocolFeeController', 'mainnet', 22348940, function () {
  const TASK_NAME = '20250430-v3-pool-pause-helper';
  const CONTRACT_NAME = 'PoolPauseHelper';

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  let task: Task;
  let pauseHelper: Contract;
  let vault: Contract;
  let vaultAdmin: Contract;
  let authorizer: Contract;
  let input: PoolPauseHelperDeployment;

  before('run task', async () => {
    task = new Task(TASK_NAME, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    pauseHelper = await task.deployedInstance(CONTRACT_NAME);

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultAdmin = await vaultTask.deployedInstance('VaultAdmin');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    input = task.input() as PoolPauseHelperDeployment;
  });

  before('grant permissions', async () => {
    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    // Grant the sweeper permission to withdraw fees.
    await authorizer.connect(govMultisig).grantRole(await actionId(vaultAdmin, 'pausePool'), pauseHelper.address);
  });
});
