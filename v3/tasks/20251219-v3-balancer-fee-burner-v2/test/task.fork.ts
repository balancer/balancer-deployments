import hre, { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { ZERO_ADDRESS } from '@helpers/constants';
import { fp } from '@helpers/numbers';
import { BalancerFeeBurnerDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describeForkTest('BalancerFeeBurner V2', 'mainnet', 24020850, function () {
  let task: Task;
  let balancerFeeBurner: Contract;
  let input: BalancerFeeBurnerDeployment;
  let whale: SignerWithAddress;
  let waETHUSDC: Contract;
  let waETHUSDT: Contract;
  let protocolFeeSweeper: Contract;
  let protocolFeeSweeperSigner: SignerWithAddress;
  let owner: SignerWithAddress;

  const WA_ETH_USDC_WHALE = '0xFeeb6FE430B7523fEF2a38327241eE7153779535';
  const RECIPIENT = '0xc8a2A4AF1cDCC3e19175dE91C767C1868ffF4564';
  const FIVE_MINUTES = 5 * 60;

  const POOL_USDT_USDC = '0x85B2b559bC2D21104C4DEFdd6EFcA8A20343361D';
  const WA_ETH_USDC_ADDRESS = '0xd4fa2d31b7968e448877f69a96de69f5de8cd23e';
  const WA_ETH_USDT_ADDRESS = '0x7Bc3485026Ac48b6cf9BaF0A377477Fff5703Af8';

  const AMOUNT_IN = 10000e6;

  before('run task', async () => {
    task = new Task('20251219-v3-balancer-fee-burner-v2', TaskMode.TEST, getForkedNetwork(hre));

    await task.run({ force: true });

    input = task.input() as BalancerFeeBurnerDeployment;
    balancerFeeBurner = await task.deployedInstance('BalancerFeeBurner');

    const protocolFeeSweeperTask = new Task(
      '20250503-v3-protocol-fee-sweeper-v2',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    protocolFeeSweeper = await protocolFeeSweeperTask.instanceAt('ProtocolFeeSweeper', input.ProtocolFeeSweeper);

    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    waETHUSDC = await testBALTokenTask.instanceAt('TestBalancerToken', WA_ETH_USDC_ADDRESS);
    waETHUSDT = await testBALTokenTask.instanceAt('TestBalancerToken', WA_ETH_USDT_ADDRESS);

    protocolFeeSweeperSigner = await impersonate(input.ProtocolFeeSweeper, fp(10));
    whale = await impersonate(WA_ETH_USDC_WHALE, fp(10));
    owner = await impersonate(input.InitialOwner, fp(10));
  });

  it('check owner', async () => {
    expect(await balancerFeeBurner.owner()).to.equal(owner.address);
  });

  it('set burn path', async () => {
    const paths = [
      {
        pool: POOL_USDT_USDC,
        tokenOut: WA_ETH_USDT_ADDRESS,
      },
    ];

    await balancerFeeBurner.connect(owner).setBurnPath(WA_ETH_USDC_ADDRESS, paths);

    const storedPaths = await balancerFeeBurner.getBurnPath(WA_ETH_USDC_ADDRESS);
    expect(storedPaths[0].pool).to.equal(POOL_USDT_USDC);
    expect(storedPaths[0].tokenOut).to.equal(WA_ETH_USDT_ADDRESS);
    expect(storedPaths.length).to.equal(1);
  });

  it('burns tokens normally', async () => {
    const paths = [
      {
        pool: POOL_USDT_USDC,
        tokenOut: WA_ETH_USDT_ADDRESS,
      },
    ];

    await balancerFeeBurner.connect(owner).setBurnPath(WA_ETH_USDC_ADDRESS, paths);

    const minAmountOut = AMOUNT_IN / 2;
    const block = await ethers.provider.getBlock('latest');

    // Transfer USDC to protocol fee sweeper
    await waETHUSDC.connect(whale).transfer(protocolFeeSweeper.address, AMOUNT_IN);

    // Approve BalancerFeeBurner to spend USDC
    await waETHUSDC.connect(protocolFeeSweeperSigner).approve(balancerFeeBurner.address, AMOUNT_IN);

    const balanceUSDTBefore = await waETHUSDT.balanceOf(RECIPIENT);

    await balancerFeeBurner
      .connect(protocolFeeSweeperSigner)
      .burn(
        ZERO_ADDRESS,
        WA_ETH_USDC_ADDRESS,
        AMOUNT_IN,
        WA_ETH_USDT_ADDRESS,
        minAmountOut,
        RECIPIENT,
        block.timestamp + FIVE_MINUTES
      );

    const balanceUSDTAfter = await waETHUSDT.balanceOf(RECIPIENT);

    expect(balanceUSDTAfter - balanceUSDTBefore).to.be.gte(minAmountOut);
  });

  it('burns tokens with new unwrap/wrap', async () => {
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const USDC_USDT_POOL = '0x6e1e9dc4b9f6cebdc8d860594e7557e1b17d4cd5'; // Low liquidity pool with RDT/DAI/USDC/USDT

    const SMALL_AMOUNT_IN = 2e6;

    const paths = [
      {
        pool: WA_ETH_USDC_ADDRESS, // Unwrap waETH-USDC to USDC
        tokenOut: USDC_ADDRESS,
        isBuffer: true,
      },
      {
        pool: USDC_USDT_POOL, // Swap USDC to USDT (raw tokens)
        tokenOut: USDT_ADDRESS,
        isBuffer: false,
      },
      {
        pool: WA_ETH_USDT_ADDRESS, // Wrap USDT to waETH-USDT
        tokenOut: WA_ETH_USDT_ADDRESS,
        isBuffer: true,
      },
    ];

    await balancerFeeBurner.connect(owner).setBurnPath(WA_ETH_USDC_ADDRESS, paths);

    const minAmountOut = SMALL_AMOUNT_IN / 2;
    const block = await ethers.provider.getBlock('latest');

    await waETHUSDC.connect(whale).transfer(protocolFeeSweeper.address, SMALL_AMOUNT_IN);
    await waETHUSDC.connect(protocolFeeSweeperSigner).approve(balancerFeeBurner.address, SMALL_AMOUNT_IN);

    const balanceWaETHUSDTBefore = await waETHUSDT.balanceOf(RECIPIENT);

    await balancerFeeBurner
      .connect(protocolFeeSweeperSigner)
      .burn(
        ZERO_ADDRESS,
        WA_ETH_USDC_ADDRESS,
        SMALL_AMOUNT_IN,
        WA_ETH_USDT_ADDRESS,
        minAmountOut,
        RECIPIENT,
        block.timestamp + FIVE_MINUTES
      );

    const balanceWaETHUSDTAfter = await waETHUSDT.balanceOf(RECIPIENT);

    expect(balanceWaETHUSDTAfter - balanceWaETHUSDTBefore).to.be.gte(minAmountOut);
  });
});
