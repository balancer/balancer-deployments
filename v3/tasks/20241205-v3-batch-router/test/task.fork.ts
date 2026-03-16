import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { fp } from '@helpers/numbers';

describeForkTest('BatchRouter-V3', 'mainnet', 21336200, function () {
  let task: Task;
  let batchRouter: Contract;
  let wethSigner: SignerWithAddress, alice: SignerWithAddress;

  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  const versionNumber = 1;
  const deploymentId = '20241205-v3-batch-router';

  before('run task', async () => {
    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    batchRouter = await task.deployedInstance('BatchRouter');

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const WETH = await testBALTokenTask.instanceAt('TestBalancerToken', WETH_ADDRESS);
    wethSigner = await impersonate(WETH.address, fp(10e8));
    alice = await getSigner();
  });

  it('checks batch router version', async () => {
    const batchRouterVersion = JSON.parse(await batchRouter.version());
    expect(batchRouterVersion.name).to.be.eq('BatchRouter');
    expect(batchRouterVersion.version).to.be.eq(versionNumber);
    expect(batchRouterVersion.deployment).to.be.eq(deploymentId);
  });

  it('checks batch router WETH', async () => {
    const wethTx = wethSigner.sendTransaction({
      to: batchRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(wethTx).to.not.be.reverted;

    const aliceTx = alice.sendTransaction({
      to: batchRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(aliceTx).to.be.reverted;
  });
});
