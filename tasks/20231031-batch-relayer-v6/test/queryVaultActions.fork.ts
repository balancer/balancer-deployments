import hre from 'hardhat';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { WeightedPoolEncoder } from '@helpers/models/pools/weighted/encoder';
import { SwapKind } from '@helpers/models/types/types';
import * as expectEvent from '@helpers/expectEvent';
import { BigNumberish, fp } from '@helpers/numbers';
import { describeForkTest, getSigner, impersonate, getForkedNetwork, Task, TaskMode } from '@src';
import { MAX_UINT256, ZERO_ADDRESS } from '@helpers/constants';
import { randomBytes } from 'ethers/lib/utils';

describeForkTest('BatchRelayerLibrary V6 - Query functionality', 'mainnet', 18412883, function () {
  const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
  const MKR = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2';

  const tokens = [DAI, MKR];
  const initialBalances = [fp(1400), fp(1)];

  const LARGE_TOKEN_HOLDER = '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503';

  const NAME = 'Balancer Pool Token';
  const SYMBOL = 'BPT';
  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);
  const WEIGHTS = [fp(0.5), fp(0.5)];

  let task: Task;
  let weightedTask: Task;

  let owner: SignerWithAddress;
  let relayer: Contract, library: Contract;
  let vault: Contract;
  let balancerQueries: Contract;
  let factory: Contract;
  let dai: Contract;
  let mkr: Contract;
  let whale: SignerWithAddress;

  before('run tasks', async () => {
    task = new Task('20231031-batch-relayer-v6', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });

    library = await task.deployedInstance('BatchRelayerLibrary');
    relayer = await task.instanceAt('BalancerRelayer', await library.getEntrypoint());

    vault = await new Task('20210418-vault', TaskMode.READ_ONLY, getForkedNetwork(hre)).deployedInstance('Vault');

    // Load BalancerQueries
    const balancerQueriesTask = new Task('20220721-balancer-queries', TaskMode.READ_ONLY, task.network);
    balancerQueries = await balancerQueriesTask.deployedInstance('BalancerQueries');

    weightedTask = new Task('20230320-weighted-pool-v4', TaskMode.READ_ONLY, task.network);
    factory = await weightedTask.deployedInstance('WeightedPoolFactory');

    dai = await task.instanceAt('IERC20', DAI);
    mkr = await task.instanceAt('IERC20', MKR);

    whale = await impersonate(LARGE_TOKEN_HOLDER);
  });

  before('get signers', async () => {
    owner = await getSigner();
  });

  function toChainedReference(key: BigNumberish): BigNumber {
    // Use the permanent prefix (temporary is 'ba10')
    const CHAINED_REFERENCE_PREFIX = 'ba11';
    // The full padded prefix is 66 characters long, with 64 hex characters and the 0x prefix.
    const paddedPrefix = `0x${CHAINED_REFERENCE_PREFIX}${'0'.repeat(64 - CHAINED_REFERENCE_PREFIX.length)}`;

    return BigNumber.from(paddedPrefix).add(key);
  }

  async function createPool(salt = ''): Promise<Contract> {
    const receipt = await (
      await factory.create(
        NAME,
        SYMBOL,
        tokens,
        WEIGHTS,
        [ZERO_ADDRESS, ZERO_ADDRESS],
        POOL_SWAP_FEE_PERCENTAGE,
        owner.address,
        salt == '' ? randomBytes(32) : salt
      )
    ).wait();

    const event = expectEvent.inReceipt(receipt, 'PoolCreated');
    return weightedTask.instanceAt('WeightedPool', event.args.pool);
  }

  async function initPool(poolId: string) {
    await dai.connect(whale).approve(vault.address, MAX_UINT256);
    await mkr.connect(whale).approve(vault.address, MAX_UINT256);

    const userData = WeightedPoolEncoder.joinInit(initialBalances);
    await vault.connect(whale).joinPool(poolId, whale.address, owner.address, {
      assets: tokens,
      maxAmountsIn: initialBalances,
      fromInternalBalance: false,
      userData,
    });
  }

  describe('swap equivalance', () => {
    let pool: Contract;
    let poolId: string;

    it('deploy a weighted pool', async () => {
      pool = await createPool();
      poolId = await pool.getPoolId();
      const [registeredAddress] = await vault.getPool(poolId);

      expect(registeredAddress).to.equal(pool.address);
    });

    it('initialize the pool', async () => {
      await initPool(poolId);

      const { balances } = await vault.getPoolTokens(poolId);
      expect(balances).to.deep.equal(initialBalances);
    });

    describe('compare to Balancer Queries', () => {
      const amountIn = fp(100);
      let actualAmountOut;
      let expectedAmountOut: BigNumber;

      sharedBeforeEach('do BalancerQuery', async () => {
        // Do a swap through Balancer Queries
        expectedAmountOut = await balancerQueries.callStatic.querySwap(
          {
            poolId: poolId,
            kind: SwapKind.GivenIn,
            assetIn: DAI,
            assetOut: MKR,
            amount: amountIn,
            userData: '0x',
          },
          {
            sender: owner.address,
            recipient: owner.address,
            fromInternalBalance: false,
            toInternalBalance: false,
          }
        );
      });

      it('check direct swap', async () => {
        const callData = library.interface.encodeFunctionData('swap', [
          {
            poolId: poolId,
            kind: SwapKind.GivenIn,
            assetIn: DAI,
            assetOut: MKR,
            amount: amountIn,
            userData: '0x',
          },
          {
            sender: owner.address,
            recipient: owner.address,
            fromInternalBalance: false,
            toInternalBalance: false,
          },
          0, // limit
          MAX_UINT256, // deadline
          0, // value
          0,
        ]);

        [actualAmountOut] = await relayer.connect(owner).callStatic.vaultActionsQueryMulticall([callData]);

        expect(actualAmountOut).to.equal(expectedAmountOut);
      });

      it('check swap with peek', async () => {
        // Trying internal peek
        const outputReference = toChainedReference(3);

        // Do the same swap through the relayer, and store the output in a chained reference
        const swapData = library.interface.encodeFunctionData('swap', [
          {
            poolId: poolId,
            kind: SwapKind.GivenIn,
            assetIn: DAI,
            assetOut: MKR,
            amount: amountIn,
            userData: '0x',
          },
          {
            sender: owner.address,
            recipient: owner.address,
            fromInternalBalance: false,
            toInternalBalance: false,
          },
          0, // limit
          MAX_UINT256, // deadline
          0, // value
          outputReference,
        ]);

        const peekData = library.interface.encodeFunctionData('peekChainedReferenceValue', [outputReference]);

        const results = await relayer.connect(owner).callStatic.vaultActionsQueryMulticall([swapData, peekData]);
        actualAmountOut = results[1];

        expect(actualAmountOut).to.equal(expectedAmountOut);
      });
    });
  });

  it('does not allow calls to manageUserBalance', async () => {
    enum UserBalanceOpKind {
      DepositInternal = 0,
      WithdrawInternal = 1,
      TransferInternal = 2,
      TransferExternal = 3,
    }

    const amount = fp(100);

    const callData = library.interface.encodeFunctionData('manageUserBalance', [
      [
        {
          kind: UserBalanceOpKind.DepositInternal,
          asset: DAI,
          amount,
          sender: owner.address,
          recipient: owner.address,
        },
        {
          kind: UserBalanceOpKind.DepositInternal,
          asset: MKR,
          amount,
          sender: owner.address,
          recipient: owner.address,
        },
      ],
      0,
      [],
    ]);

    await expect(relayer.connect(owner).vaultActionsQueryMulticall([callData])).to.be.revertedWith('BAL#998');
  });
});
