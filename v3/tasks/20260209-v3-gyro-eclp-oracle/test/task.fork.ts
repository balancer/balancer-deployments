import hre from 'hardhat';
import { Contract } from 'ethers';
import { deploy, describeForkTest, getForkedNetwork, Task, TaskMode } from '@src';
import { fpMul, fromFp } from '@helpers/numbers';
import { expect } from 'chai';
import { ZERO_ADDRESS } from '@helpers/constants';
import input from '../input';
import { expectRevertWithCustomError } from '@helpers/expectCustomError';

describeForkTest('EclpLPOracle', 'base', 41687300, function () {
  let task: Task;
  let eclpLPOracleFactory: Contract, eclpLPOracle: Contract;
  let poolToken: Contract;
  let unlockHelper: Contract;

  const ECLP_POOL_ADDRESS = '0x1a48f20a34e523394dea029d8854634b9fe43ec2';

  const ETH_FEED_ADDRESS = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70';
  const USDC_FEED_ADDRESS = '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B';

  before('run task', async () => {
    task = new Task('20260209-v3-gyro-eclp-oracle', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    eclpLPOracleFactory = await task.deployedInstance('EclpLPOracleFactory');
  });

  before('setup contracts and addresses', async () => {
    const vaultTask = new Task('20241204-v3-vault', TaskMode.READ_ONLY, getForkedNetwork(hre));
    const vault = await vaultTask.deployedInstance('Vault');

    poolToken = await vaultTask.instanceAt('IERC20', ECLP_POOL_ADDRESS);
    unlockHelper = await deploy('VaultUnlockTestHelper', [vault.address]);
  });

  it('checks version', async () => {
    const factoryVersion = JSON.parse(await eclpLPOracleFactory.version());
    expect(factoryVersion.deployment).to.be.eq(task.id);
    expect(factoryVersion.name).to.be.eq('EclpLPOracleFactory');
    expect(factoryVersion.version).to.be.eq(input.OracleVersion);
  });

  it('creates oracle', async () => {
    // Feeds are ordered according to the token order registered in the pool.
    const tx = await eclpLPOracleFactory.create(
      ECLP_POOL_ADDRESS,
      input.ShouldUseBlockTimeForOldestFeedUpdate,
      input.ShouldRevertIfVaultUnlocked,
      [ETH_FEED_ADDRESS, USDC_FEED_ADDRESS]
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find((e: { event: string }) => e.event === 'EclpLPOracleCreated');

    // NOTE: this is going to print "duplicate definition - ZeroDivision()" in the console, ignore it.
    // It's from using Ethers V5, and both FixedPoint and SignedFixedPoint defining the same error.
    eclpLPOracle = await task.instanceAt('EclpLPOracle', event?.args?.oracle);
    expect(eclpLPOracle).to.not.be.undefined;
    expect(eclpLPOracle).to.not.be.eq(ZERO_ADDRESS);

    expect(await eclpLPOracle.getShouldUseBlockTimeForOldestFeedUpdate()).to.be.equal(
      input.ShouldUseBlockTimeForOldestFeedUpdate
    );
    expect(await eclpLPOracle.getShouldRevertIfVaultUnlocked()).to.be.equal(input.ShouldRevertIfVaultUnlocked);
  });

  it('checks price feeds', async () => {
    const priceFeeds = await eclpLPOracle.getFeeds();
    expect(priceFeeds[0]).to.be.eq(ETH_FEED_ADDRESS);
    expect(priceFeeds[1]).to.be.eq(USDC_FEED_ADDRESS);
  });

  it('checks prices', async () => {
    const { prices } = await eclpLPOracle.getFeedData();
    expect(fromFp(prices[0])).to.be.equalWithError(2225);
    expect(fromFp(prices[1])).to.be.equalWithError(0.999);
  });

  it('gets TVL measured in USD', async () => {
    const [, answer] = await eclpLPOracle.latestRoundData();
    const totalSupply = await poolToken.totalSupply();

    // This is the TVL in USD at the current block.
    expect(fromFp(fpMul(answer, totalSupply))).to.be.equalWithError(3121);
  });

  it('reverts if the Vault is unlocked', async () => {
    expect(await eclpLPOracle.getShouldRevertIfVaultUnlocked()).to.be.true;
    const callData = eclpLPOracle.interface.encodeFunctionData('latestRoundData');

    await expectRevertWithCustomError(
      unlockHelper.callWhileUnlocked(eclpLPOracle.address, callData),
      'VaultIsUnlocked()'
    );
  });
});
