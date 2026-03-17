import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, impersonate, Task, TaskMode } from '@src';
import { fp } from '@helpers/numbers';
import { TokenPairRegistryDeployment } from '../input';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';

describeForkTest('TokenPairRegistry', 'mainnet', 23083800, function () {
  let task: Task;
  let tokenPairRegistry: Contract;
  let input: TokenPairRegistryDeployment;
  let admin: SignerWithAddress;
  let waUSDC: Contract, waUSDT: Contract, waGHO: Contract;
  let USDC: Contract, USDT: Contract, GHO: Contract;

  const STABLE_POOL_ADDRESS = '0x85B2b559bC2D21104C4DEFdd6EFcA8A20343361D';
  const WA_USDC_ADDRESS = '0xD4fa2D31b7968E448877f69A96DE69f5de8cD23E';
  const WA_USDT_ADDRESS = '0x7Bc3485026Ac48b6cf9BaF0A377477Fff5703Af8';
  const WA_GHO_ADDRESS = '0xC71Ea051a5F82c67ADcF634c36FFE6334793D24C';

  before('run task', async () => {
    task = new Task('20250806-v3-token-pair-registry', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    tokenPairRegistry = await task.deployedInstance('TokenPairRegistry');
  });

  before('setup contracts and addresses', async () => {
    input = task.input() as TokenPairRegistryDeployment;

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    waUSDC = await vaultTask.instanceAt('IERC4626', WA_USDC_ADDRESS);
    waUSDT = await vaultTask.instanceAt('IERC4626', WA_USDT_ADDRESS);
    waGHO = await vaultTask.instanceAt('IERC4626', WA_GHO_ADDRESS);

    USDC = await vaultTask.instanceAt('IERC20', await waUSDC.asset());
    USDT = await vaultTask.instanceAt('IERC20', await waUSDT.asset());
    GHO = await vaultTask.instanceAt('IERC20', await waGHO.asset());

    admin = await impersonate(input.InitialOwner, fp(10));
  });

  it('check owner', async () => {
    expect(await tokenPairRegistry.owner()).to.equal(admin.address);
  });

  it('set e2e boosted pool path (underlying <--> underlying)', async () => {
    const boostedPoolPath = [];
    boostedPoolPath.push({
      pool: waUSDC.target.toString(),
      tokenOut: waUSDC.target.toString(),
      isBuffer: true,
    });
    boostedPoolPath.push({
      pool: STABLE_POOL_ADDRESS,
      tokenOut: waUSDT.target.toString(),
      isBuffer: false,
    });
    boostedPoolPath.push({
      pool: waUSDT.target.toString(),
      tokenOut: USDT.target.toString(),
      isBuffer: true,
    });

    await (tokenPairRegistry.connect(admin) as Contract).addPath(USDC.target.toString(), boostedPoolPath);
    expect(await tokenPairRegistry.getPaths(USDC.target.toString(), USDT.target.toString())).to.deep.equal([
      boostedPoolPath.map((o) => Object.values(o)),
    ]);
  });

  it('set boosted pool path', async () => {
    await (tokenPairRegistry.connect(admin) as Contract).addSimplePath(STABLE_POOL_ADDRESS);

    const waUsdtPath = [
      {
        pool: STABLE_POOL_ADDRESS,
        tokenOut: waUSDT.target.toString(),
        isBuffer: false,
      },
    ].map((o) => Object.values(o));

    const waUsdcPath = [
      {
        pool: STABLE_POOL_ADDRESS,
        tokenOut: waUSDC.target.toString(),
        isBuffer: false,
      },
    ].map((o) => Object.values(o));

    const waGhoPath = [
      {
        pool: STABLE_POOL_ADDRESS,
        tokenOut: waGHO.target.toString(),
        isBuffer: false,
      },
    ].map((o) => Object.values(o));

    expect(await tokenPairRegistry.getPaths(waUSDC.target.toString(), waUSDT.target.toString())).to.deep.equal([
      waUsdtPath,
    ]);
    expect(await tokenPairRegistry.getPaths(waUSDT.target.toString(), waUSDC.target.toString())).to.deep.equal([
      waUsdcPath,
    ]);

    expect(await tokenPairRegistry.getPaths(waUSDC.target.toString(), waGHO.target.toString())).to.deep.equal([
      waGhoPath,
    ]);
    expect(await tokenPairRegistry.getPaths(waGHO.target.toString(), waUSDC.target.toString())).to.deep.equal([
      waUsdcPath,
    ]);

    expect(await tokenPairRegistry.getPaths(waUSDT.target.toString(), waGHO.target.toString())).to.deep.equal([
      waGhoPath,
    ]);
    expect(await tokenPairRegistry.getPaths(waGHO.target.toString(), waUSDT.target.toString())).to.deep.equal([
      waUsdtPath,
    ]);
  });

  it('set buffer path', async () => {
    await (tokenPairRegistry.connect(admin) as Contract).addSimplePath(waGHO.target.toString());

    const wrapPath = [
      {
        pool: waGHO.target.toString(),
        tokenOut: waGHO.target.toString(),
        isBuffer: true,
      },
    ].map((o) => Object.values(o));

    const unwrapPath = [
      {
        pool: waGHO.target.toString(),
        tokenOut: GHO.target.toString(),
        isBuffer: true,
      },
    ].map((o) => Object.values(o));

    expect(await tokenPairRegistry.getPaths(GHO.target.toString(), waGHO.target.toString())).to.deep.equal([wrapPath]);
    expect(await tokenPairRegistry.getPaths(waGHO.target.toString(), GHO.target.toString())).to.deep.equal([
      unwrapPath,
    ]);
  });
});
