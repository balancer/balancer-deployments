import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { VaultExplorerDeployment } from '../input';

describeForkTest('Vault Explorer', 'mainnet', 21336938, function () {
  let task: Task;
  let vault: Contract;
  let vaultExtension: Contract;
  let mockPool: Contract;
  let explorer: Contract;
  let input: VaultExplorerDeployment;

  before('run task', async () => {
    task = new Task('v3-vault-explorer', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    explorer = await task.deployedInstance('VaultExplorer');
  });

  before('setup contracts and parameters', async () => {
    const poolTask = new Task('20241205-v3-weighted-pool', TaskMode.READ_ONLY, getForkedNetwork(hre));
    mockPool = await poolTask.instanceAt('WeightedPool', poolTask.output()['MockWeightedPool']);

    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    vault = await vaultTask.deployedInstance('Vault');
    vaultExtension = await vaultTask.deployedInstance('VaultExtension');
  });

  it('checks contract addresses', async () => {
    expect(await explorer.getVault()).eq(vault.address);

    const extensionAddress = await explorer.getVaultExtension();
    expect(extensionAddress).to.eq(vaultExtension.address);

    expect(await vaultExtension.getVaultAdmin()).to.eq(await explorer.getVaultAdmin());
  });

  it('checks pool tokens', async () => {
    input = task.input() as VaultExplorerDeployment;

    const extensionEntrypoint = vaultExtension.attach(vault.address);
    const poolTokens = (await extensionEntrypoint.getPoolTokens(mockPool.address)).map((token: string) =>
      token.toLowerCase()
    );
    expect(poolTokens).to.be.deep.eq([input.BAL.toLowerCase(), input.WETH.toLowerCase()]);

    const explorerPoolTokens = (await explorer.getPoolTokens(mockPool.address)).map((token: string) =>
      token.toLowerCase()
    );
    expect(explorerPoolTokens).to.be.deep.eq(poolTokens);
  });
});
