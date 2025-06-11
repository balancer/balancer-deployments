import hre from 'hardhat';
import { Contract } from 'ethers';
import * as expectEvent from '@helpers/expectEvent';
import { describeForkTest, getForkedNetwork, getSigner, impersonate, Task, TaskMode } from '@src';
import { fp } from '@helpers/numbers';
import { WeightedLPOracleDeployment } from '../input';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

describeForkTest('WeightedLPOracle', 'mainnet', 22647247, function () {
  let task: Task;
  let input: WeightedLPOracleDeployment;
  let weightedLPOracleFactory: Contract;
  let authorizer: Contract;

  const POOL = '0xecD2978447367eC0c944Af58C3B8a7b52Acfd7a4'; // 1ROR / WETH
  const PRICE_FEED = [
    // AAVE/USD price feed (we use AAVE because there is no 1ROR/USD price feed)
    '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9',
    // ETH/USD price feed
    '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  ];
  let admin: SignerWithAddress;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  before('run task', async () => {
    task = new Task('20250605-v3-weighted-lp-oracle', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
  });

  before('setup contracts and signers', async () => {
    admin = await getSigner();

    weightedLPOracleFactory = await task.deployedInstance('WeightedLPOracleFactory');

    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const govMultisig = await impersonate(GOV_MULTISIG, fp(100));
    await authorizer
      .connect(govMultisig)
      .grantRole(
        await weightedLPOracleFactory.getActionId(weightedLPOracleFactory.interface.getSighash('create')),
        admin.address
      );

    input = task.input() as WeightedLPOracleDeployment;
  });

  it('should deploy WeightedLPOracleFactory', async () => {
    const receipt = await (await weightedLPOracleFactory.connect(admin).create(POOL, PRICE_FEED)).wait();
    const event = expectEvent.inReceipt(receipt, 'WeightedLPOracleCreated');
    const oracleAddress = event.args.oracle;

    const oracle = await task.instanceAt('WeightedLPOracle', oracleAddress);
    expect((await oracle.latestRoundData()).answer > BigInt(0)).to.be.true;
  });
});
