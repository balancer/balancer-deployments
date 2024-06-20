import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { OmniVotingEscrowDeployment as OmniVotingEscrowDeployment } from '../input';

describeForkTest('OmniVotingEscrow', 'mainnet', 17331260, function () {
  let deployer: SignerWithAddress;

  let task: Task;
  let omniVotingEscrow: Contract, veBalRemapper: Contract;
  let input: OmniVotingEscrowDeployment;

  const LM_MULTISIG = '0xc38c5f97B34E175FFd35407fc91a937300E33860';

  // https://docs.layerzero.network/v1/developers/evm/technical-reference/mainnet/mainnet-addresses
  const POLYGON_LZ_CHAIN_ID = 109;
  // https://github.com/LayerZero-Labs/lz_gauges/blob/main/deployments/polygon/OmniVotingEscrowChild.json#L2
  const POLYGON_TRUSTED_ENDPOINT = '0xE241C6e48CA045C7f631600a0f1403b2bFea05ad';

  before('run OmniVotingEscrow task', async () => {
    task = new Task('20230524-mainnet-lz-omni-voting-escrow', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    omniVotingEscrow = await task.deployedInstance('OmniVotingEscrow');
    input = task.input() as OmniVotingEscrowDeployment;
  });

  before('setup contracts', async () => {
    const veBalRemapperTask = new Task('20230504-vebal-remapper', TaskMode.READ_ONLY, getForkedNetwork(hre));
    veBalRemapper = await veBalRemapperTask.deployedInstance('VotingEscrowRemapper');
  });

  before('setup accounts', async () => {
    deployer = (await ethers.getSigners())[0];
  });

  context('constructor', async () => {
    it('stores the endpoint', async () => {
      expect(await omniVotingEscrow.lzEndpoint()).to.equal(input.LayerZeroEndpoint);
    });

    it('stores the remapper', async () => {
      expect(await omniVotingEscrow.votingEscrowRemapper()).to.equal(veBalRemapper.address);
    });
  });

  context('setup and transfer ownership', async () => {
    it('wires trusted endpoint', async () => {
      await expect(omniVotingEscrow.getTrustedRemoteAddress(POLYGON_LZ_CHAIN_ID)).to.be.revertedWith(
        'LzApp: no trusted path record'
      );
      const encodedEndpoint = ethers.utils.defaultAbiCoder.encode(['bytes'], [POLYGON_TRUSTED_ENDPOINT]);
      await omniVotingEscrow.connect(deployer).setTrustedRemoteAddress(POLYGON_LZ_CHAIN_ID, encodedEndpoint);

      const remoteAddressBytes = await omniVotingEscrow.getTrustedRemoteAddress(POLYGON_LZ_CHAIN_ID);
      const decodedAddress = ethers.utils.defaultAbiCoder.decode(['bytes'], remoteAddressBytes)[0];

      expect(decodedAddress).to.be.eq(POLYGON_TRUSTED_ENDPOINT.toLowerCase());
    });

    it('transfer ownership to LM multisig', async () => {
      expect(await omniVotingEscrow.owner()).to.be.eq(deployer.address);

      await omniVotingEscrow.connect(deployer).transferOwnership(LM_MULTISIG);
      expect(await omniVotingEscrow.owner()).to.be.eq(LM_MULTISIG);
    });
  });
});
