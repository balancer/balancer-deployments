import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode, deploy } from '@src';
import * as expectEvent from '@helpers/expectEvent';
import { sharedBeforeEach } from '@helpers/sharedBeforeEach';

function doForkTestsOnNetwork(network: string, block: number) {
  describeForkTest(`BatchRelayerLibrary V6 - Gauge checkpoints - ${network}`, network, block, function () {
    let task: Task;

    let relayer: Contract, library: Contract;
    let sender: SignerWithAddress;
    let vault: Contract, authorizer: Contract;
    let childChainGaugeFactory: Contract;
    let gaugeAddressA: string, gaugeAddressB: string;

    before('run task', async () => {
      task = new Task('20231031-batch-relayer-v6', TaskMode.TEST, getForkedNetwork(hre));
      await task.run({ force: true });

      library = await task.deployedInstance('BatchRelayerLibrary');
      relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());
    });

    before('load vault and tokens', async () => {
      const vaultTask = new Task('20210418-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
      vault = await vaultTask.instanceAt('Vault', await library.getVault());

      const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
      authorizer = await authorizerTask.deployedInstance('Authorizer');

      const childChainGaugeFactoryTask = new Task(
        '20230316-child-chain-gauge-factory-v2',
        TaskMode.READ_ONLY,
        getForkedNetwork(hre)
      );
      childChainGaugeFactory = await childChainGaugeFactoryTask.deployedInstance('ChildChainGaugeFactory');
    });

    before('deploy auxiliary contracts (tokens and gauges)', async () => {
      const tokenA = await deploy('TestToken', ['Token A', 'TSTA', 18]);
      const tokenB = await deploy('TestToken', ['Token B', 'TSTB', 18]);

      const txA = await childChainGaugeFactory.create(tokenA.address);
      gaugeAddressA = expectEvent.inReceipt(await txA.wait(), 'GaugeCreated').args.gauge;
      const txB = await childChainGaugeFactory.create(tokenB.address);
      gaugeAddressB = expectEvent.inReceipt(await txB.wait(), 'GaugeCreated').args.gauge;
      expect(gaugeAddressA).to.not.be.eq(gaugeAddressB);
    });

    before('load signers', async () => {
      [, sender] = await ethers.getSigners();
    });

    before('approve relayer at the authorizer', async () => {
      const relayerActionIds = await Promise.all(
        ['swap', 'batchSwap', 'joinPool', 'exitPool', 'setRelayerApproval', 'manageUserBalance'].map((action) =>
          vault.getActionId(vault.interface.getSighash(action))
        )
      );

      // We impersonate an account with the default admin role in order to be able to approve the relayer. This assumes
      // such an account exists.
      const admin = await impersonate(await authorizer.getRoleMember(await authorizer.DEFAULT_ADMIN_ROLE(), 0));

      // Grant relayer permission to call all relayer functions
      await authorizer.connect(admin).grantRoles(relayerActionIds, relayer.address);
    });

    sharedBeforeEach('approve relayer by the user', async () => {
      await vault.connect(sender).setRelayerApproval(sender.address, relayer.address, true);
    });

    it('can call user checkpoint: true', async () => {
      expect(await library.canCallUserCheckpoint()).to.be.true;
    });

    it('sender can update their gauge liquidity limits', async () => {
      const tx = await relayer
        .connect(sender)
        .multicall([
          library.interface.encodeFunctionData('gaugeCheckpoint', [sender.address, [gaugeAddressA, gaugeAddressB]]),
        ]);

      const gaugeInterface = new ethers.utils.Interface([
        'event UpdateLiquidityLimit(address indexed user, uint256 original_balance, uint256 original_supply, uint256 working_balance, uint256 working_supply)',
      ]);

      expectEvent.inIndirectReceipt(
        await tx.wait(),
        gaugeInterface,
        'UpdateLiquidityLimit',
        { user: sender.address },
        gaugeAddressA
      );

      expectEvent.inIndirectReceipt(
        await tx.wait(),
        gaugeInterface,
        'UpdateLiquidityLimit',
        { user: sender.address },
        gaugeAddressB
      );
    });
  });
}

const networksUnderTest = {
  polygon: 49698000,
  arbitrum: 148441000,
  optimism: 111935000,
  gnosis: 30856000,
  avalanche: 37505000,
  zkevm: 7228000,
  base: 6339000,
};

Object.entries(networksUnderTest).forEach(([network, block]) => doForkTestsOnNetwork(network, block));
