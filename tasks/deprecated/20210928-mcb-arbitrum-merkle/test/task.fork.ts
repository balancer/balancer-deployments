import hre, { ethers } from 'hardhat';
import { Contract, BigNumber } from 'ethers';

import { bn, fp } from '@helpers/numbers';
import { expectEqualWithError } from '@helpers/relativeError';
import { MerkleTree } from '@helpers/merkleTree';

import { MAX_UINT256 } from '@helpers/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { describeForkTest, getSigner, impersonate, getForkedNetwork, Task, TaskMode } from '@src';

function encodeElement(address: string, balance: BigNumber): string {
  return ethers.utils.solidityKeccak256(['address', 'uint'], [address, balance]);
}

describeForkTest('MerkleRedeem', 'arbitrum', 1731663, function () {
  let lp: SignerWithAddress, other: SignerWithAddress, whale: SignerWithAddress;
  let distributor: Contract, token: Contract;

  let task: Task;

  const REWARD_TOKEN_ADDRESS = '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42'; // MCB on arbitrum
  const REWARD_WHALE_ADDRESS = '0x34851ea13bde818b1efe26d31377906b47c9bbe2';

  before('run task', async () => {
    task = new Task('20210928-mcb-arbitrum-merkle', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    distributor = await task.instanceAt('MerkleRedeem', task.output().MerkleRedeem);
  });

  before('load signers and transfer ownership', async () => {
    lp = await getSigner(2);
    other = await getSigner(3);
    whale = await impersonate(REWARD_WHALE_ADDRESS);
    token = await task.instanceAt('IERC20', REWARD_TOKEN_ADDRESS);

    await distributor.transferOwnership(whale.address);
    await token.connect(whale).approve(distributor.address, MAX_UINT256);
  });

  describe('with an allocation defined', async () => {
    let root: string;
    let proof: string[];

    before(() => {
      const elements: string[] = [encodeElement(lp.address, fp(66)), encodeElement(other.address, fp(34))];

      const merkleTree = new MerkleTree(elements);
      root = merkleTree.getHexRoot();

      proof = merkleTree.getHexProof(elements[0]);
    });

    it('can seed an allocation', async () => {
      await distributor.connect(whale).seedAllocations(bn(0), root, fp(100));

      const expectedReward = fp(100);
      expectEqualWithError(await token.balanceOf(distributor.address), expectedReward, fp(1));
    });

    it('can claim a reward', async () => {
      await distributor.connect(whale).seedAllocations(bn(1), root, fp(100));

      await distributor.connect(lp).claimWeek(lp.address, bn(1), fp(66), proof);
      expectEqualWithError(await token.balanceOf(lp.address), fp(66), fp(1));
    });
  });
});
