import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { bn, fp } from '@helpers/numbers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { advanceToTimestamp, currentWeekTimestamp, DAY, HOUR, WEEK } from '@helpers/time';
import * as expectEvent from '@helpers/expectEvent';

import { expectTransferEvent } from '@helpers/expectTransfer';
import { TypedDataEncoder } from 'ethers';

import { describeForkTest, impersonate, getForkedNetwork, Task, TaskMode } from '@src';

describeForkTest.skip('FeeDistributor', 'mainnet', 15130000, function () {
  let veBALHolder: SignerWithAddress,
    veBALHolder2: SignerWithAddress,
    feeCollector: SignerWithAddress,
    voterProxyAdmin: SignerWithAddress;
  let distributor: Contract;

  let VEBAL: Contract, BAL: Contract, WETH: Contract, voterProxy: Contract;

  let task: Task;

  const VEBAL_HOLDER = '0xA2e7002E0FFC42e4228292D67C13a81FDd191870';
  const VEBAL_HOLDER_2 = '0x49a2dcc237a65cc1f412ed47e0594602f6141936';
  const PROTOCOL_FEE_COLLECTOR = '0xce88686553686da562ce7cea497ce749da109f9f';
  const VOTER_PROXY_ADMIN = '0x7818a1da7bd1e64c199029e86ba244a9798eee10';

  const BAL_ADDRESS = '0xba100000625a3754423978a60c9317c58a424e3D';
  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const VOTER_PROXY_ADDRESS = '0xaf52695e1bb01a16d33d7194c28c42b10e0dbec2';

  const balAmount = fp(42);
  const wethAmount = fp(5);

  let firstWeek: bigint;

  before('run task', async () => {
    task = new Task('20220714-fee-distributor-v2', TaskMode.TEST, getForkedNetwork(hre));
    await advanceToTimestamp(1657756800 + HOUR);
    await task.run({ force: true });
    distributor = await task.instanceAt('FeeDistributor', task.output({ network: 'test' }).FeeDistributor);
  });

  before('setup accounts', async () => {
    veBALHolder = await impersonate(VEBAL_HOLDER);
    veBALHolder2 = await impersonate(VEBAL_HOLDER_2);
    feeCollector = await impersonate(PROTOCOL_FEE_COLLECTOR);
    voterProxyAdmin = await impersonate(VOTER_PROXY_ADMIN);
  });

  before('setup contracts', async () => {
    const veBALTask = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, getForkedNetwork(hre));
    VEBAL = await veBALTask.instanceAt('VotingEscrow', await veBALTask.output({ network: 'mainnet' }).VotingEscrow);

    // We reuse this task as it contains an ABI similar to the one in real ERC20 tokens
    const testBALTokenTask = new Task('20220325-test-balancer-token', TaskMode.READ_ONLY, getForkedNetwork(hre));
    BAL = await testBALTokenTask.instanceAt('TestBalancerToken', BAL_ADDRESS);
    WETH = await testBALTokenTask.instanceAt('TestBalancerToken', WETH_ADDRESS);
  });

  // These tests are the same as in the 20220420-fee-distributor task.
  describe('claims', () => {
    context('in the first week', () => {
      before(async () => {
        firstWeek = bn(task.input().startTime);
        await advanceToTimestamp(firstWeek + BigInt(DAY));
      });

      context('with BAL distributed', () => {
        before('send BAL to distribute', async () => {
          await (BAL.connect(feeCollector) as Contract).approve(distributor.target.toString(), balAmount);
          await (distributor.connect(feeCollector) as Contract).depositToken(BAL.target.toString(), balAmount);
        });

        it('veBAL holders cannot yet claim tokens', async () => {
          const balancesBefore = await Promise.all([BAL, WETH].map((token) => token.balanceOf(veBALHolder.address)));
          const tx = await distributor.claimTokens(veBALHolder.address, [BAL.target.toString(), WETH.target.toString()]);
          const balancesAfter = await Promise.all([BAL, WETH].map((token) => token.balanceOf(veBALHolder.address)));

          expectEvent.notEmitted(await tx.wait(), 'TokensClaimed');

          expect(balancesAfter).to.deep.equal(balancesBefore);
        });
      });
    });

    context('in the second week', () => {
      before('advance time', async () => {
        // 1 day into the second week
        await advanceToTimestamp(firstWeek + BigInt(WEEK) + BigInt(DAY));
      });

      context('with WETH distributed', () => {
        before('send BAL to distribute', async () => {
          await (BAL.connect(feeCollector) as Contract).approve(distributor.target.toString(), balAmount * BigInt(3));
          await (distributor.connect(feeCollector) as Contract).depositToken(BAL.target.toString(), balAmount * BigInt(3));
        });

        before('send WETH to distribute', async () => {
          await (WETH.connect(feeCollector) as Contract).approve(distributor.target.toString(), wethAmount);
          await (distributor.connect(feeCollector) as Contract).depositToken(WETH.target.toString(), wethAmount);
        });

        it('veBAL holders can claim BAL and not WETH', async () => {
          const holderFirstWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder.address, firstWeek);
          const firstWeekSupply = await VEBAL['totalSupply(uint256)'](firstWeek);
          const expectedBALAmount = balAmount * holderFirstWeekBalance / firstWeekSupply;

          const wethBalanceBefore = await WETH.balanceOf(veBALHolder.address);
          const tx = await distributor.claimTokens(veBALHolder.address, [BAL.target.toString(), WETH.target.toString()]);
          const wethBalanceAfter = await WETH.balanceOf(veBALHolder.address);

          expectTransferEvent(
            await tx.wait(),
            { from: distributor.target.toString(), to: veBALHolder.address, value: expectedBALAmount },
            BAL.target.toString()
          );
          expect(wethBalanceAfter).to.equal(wethBalanceBefore);
        });
      });
    });

    context('in the third week', () => {
      before('advance time', async () => {
        // 1 day into the third week
        await advanceToTimestamp(firstWeek + BigInt(2 * WEEK) + BigInt(DAY));
      });

      it('veBAL holders can claim BAL and WETH', async () => {
        const secondWeek = firstWeek + BigInt(WEEK);
        const holderSecondWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder.address, secondWeek);
        const secondWeekSupply = await VEBAL['totalSupply(uint256)'](secondWeek);

        const expectedBALAmount = balAmount * BigInt(3) * holderSecondWeekBalance / secondWeekSupply;
        const expectedWETHAmount = wethAmount * holderSecondWeekBalance / secondWeekSupply;

        const tx = await distributor.claimTokens(veBALHolder.address, [BAL.target.toString(), WETH.target.toString()]);

        expectTransferEvent(
          await tx.wait(),
          { from: distributor.target.toString(), to: veBALHolder.address, value: expectedBALAmount },
          BAL.target.toString()
        );

        expectTransferEvent(
          await tx.wait(),
          { from: distributor.target.toString(), to: veBALHolder.address, value: expectedWETHAmount },
          WETH.target.toString()
        );
      });

      it('veBAL holders can claim all the BAL and WETH at once', async () => {
        const holderFirstWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder2.address, firstWeek);
        const firstWeekSupply = await VEBAL['totalSupply(uint256)'](firstWeek);
        const balFirstWeekAmount = balAmount * holderFirstWeekBalance / firstWeekSupply;

        const secondWeek = firstWeek + BigInt(WEEK);
        const holderSecondWeekBalance = await VEBAL['balanceOf(address,uint256)'](veBALHolder2.address, secondWeek);
        const secondWeekSupply = await VEBAL['totalSupply(uint256)'](secondWeek);
        const balSecondWeekAmount = balAmount * BigInt(3) * holderSecondWeekBalance / secondWeekSupply;

        const expectedBALAmount = balFirstWeekAmount + balSecondWeekAmount;
        const expectedWETHAmount = wethAmount * holderSecondWeekBalance / secondWeekSupply;

        const tx = await distributor.claimTokens(veBALHolder2.address, [BAL.target.toString(), WETH.target.toString()]);

        expectTransferEvent(
          await tx.wait(),
          { from: distributor.target.toString(), to: veBALHolder2.address, value: expectedBALAmount },
          BAL.target.toString()
        );

        expectTransferEvent(
          await tx.wait(),
          { from: distributor.target.toString(), to: veBALHolder2.address, value: expectedWETHAmount },
          WETH.target.toString()
        );
      });
    });
  });

  describe('only caller check', () => {
    before('setup voter proxy', async () => {
      const voterProxyABI = [
        'function isValidSignature(bytes32 _hash, bytes) view returns (bytes4)',
        'function setVote(bytes32 _hash, bool _valid)',
        'function claimFees(address _distroContract, address _token) returns (uint256)',
      ];

      voterProxy = await ethers.getContractAt(voterProxyABI, VOTER_PROXY_ADDRESS) as Contract;
      // VoterProxy contract doesn't actually use the signature; only voting with the right hash matters.
      // This hash is the distributor's outcome when enabling the caller check form the VoterProxy with the first
      // available nonce.

      const domain = {
        name: 'FeeDistributor',
        version: '1',
        chainId: (await distributor.runner!.provider!.getNetwork()).chainId,
        verifyingContract: distributor.target.toString(),
      };

      const types = {
        SetOnlyCallerCheck: [
          { name: 'user', type: 'address' },
          { name: 'enabled', type: 'bool' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const values = {
        user: voterProxy.target.toString(),
        enabled: true,
        nonce: (await distributor.getNextNonce(voterProxy.target.toString())).toString(),
      };

      await (voterProxy.connect(voterProxyAdmin) as Contract).setVote(TypedDataEncoder.hash(domain, types, values), true);
      await (distributor.connect(voterProxyAdmin) as Contract).setOnlyCallerCheckWithSignature(voterProxy.target.toString(), true, '0x');
    });

    context('in the third week, when every token is claimable', () => {
      before(async () => {
        firstWeek = await currentWeekTimestamp();
        await advanceToTimestamp(firstWeek + BigInt(2 * WEEK) + BigInt(DAY));
      });

      it('other account cannot claim for voter proxy', async () => {
        await expect(distributor.claimTokens(voterProxy.target.toString(), [BAL.target.toString(), WETH.target.toString()])).to.be.revertedWith(
          'BAL#401'
        );
      });

      it('voter proxy can claim fees', async () => {
        await expect((voterProxy.connect(voterProxyAdmin) as Contract).claimFees(distributor.target.toString(), BAL.target.toString())).to.not.be
          .reverted;

        await expect((voterProxy.connect(voterProxyAdmin) as Contract).claimFees(distributor.target.toString(), WETH.target.toString())).to.not.be
          .reverted;
      });
    });
  });
});
