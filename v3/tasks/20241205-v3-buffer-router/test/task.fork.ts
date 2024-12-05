import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MAX_UINT48 } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import { BufferRouterDeployment } from '../input';

describeForkTest('BufferRouter-V3', 'mainnet', 21336200, function () {
  let task: Task;
  let bufferRouter: Contract, vault: Contract, permit2: Contract, usdc: Contract;
  let wethSigner: SignerWithAddress, alice: SignerWithAddress, usdcWhale: SignerWithAddress;

  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const waUSDC_ADDRESS = '0x73edDFa87C71ADdC275c2b9890f5c3a8480bC9E6';
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

  const USDC_WHALE = '0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa';

  const versionNumber = 1;
  const deploymentId = '20241205-v3-buffer-router';

  before('run task', async () => {
    task = new Task(deploymentId, TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    const input = task.input() as BufferRouterDeployment;

    bufferRouter = await task.deployedInstance('BufferRouter');
    permit2 = await task.instanceAt('IPermit2', input.Permit2);

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const WETH = await testBALTokenTask.instanceAt('TestBalancerToken', WETH_ADDRESS);
    wethSigner = await impersonate(WETH.address, fp(10e8));
    alice = await getSigner();
    usdcWhale = await impersonate(USDC_WHALE, fp(10));

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    usdc = await testBALTokenTask.instanceAt('TestBalancerToken', USDC_ADDRESS);
  });

  it('checks buffer router version', async () => {
    const bufferRouterVersion = JSON.parse(await bufferRouter.version());
    expect(bufferRouterVersion.name).to.be.eq('BufferRouter');
    expect(bufferRouterVersion.version).to.be.eq(versionNumber);
    expect(bufferRouterVersion.deployment).to.be.eq(deploymentId);
  });

  it('checks router WETH', async () => {
    const wethTx = wethSigner.sendTransaction({
      to: bufferRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(wethTx).to.not.be.reverted;

    const aliceTx = alice.sendTransaction({
      to: bufferRouter.address,
      value: ethers.utils.parseEther('1.0'),
    });
    await expect(aliceTx).to.be.reverted;
  });

  it('tests buffer initialization', async () => {
    const initBalance = 1000000e6;
    await usdc.connect(usdcWhale).approve(permit2.address, initBalance);
    await permit2.connect(usdcWhale).approve(USDC_ADDRESS, bufferRouter.address, initBalance, MAX_UINT48);

    // We need to call methods that don't exist in the vault.
    const abi = [
      'function isERC4626BufferInitialized(address) external view returns (bool)',
      'function getERC4626BufferAsset(address) external view returns (address)',
    ];
    const vaultAsExtension = new ethers.Contract(vault.address, abi, usdcWhale);

    await bufferRouter.connect(usdcWhale).initializeBuffer(waUSDC_ADDRESS, 1000000e6, 0, 0);
    expect(await vaultAsExtension.isERC4626BufferInitialized(waUSDC_ADDRESS)).to.be.true;
    expect(await vaultAsExtension.getERC4626BufferAsset(waUSDC_ADDRESS)).to.be.eq(USDC_ADDRESS);
  });
});
