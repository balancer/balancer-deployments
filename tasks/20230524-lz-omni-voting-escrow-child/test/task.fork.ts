import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { OmniVotingEscrowChildDeployment } from '../input';

describeForkTest('OmniVotingEscrowChild', 'arbitrum', 94050211, function () {
  let deployer: SignerWithAddress;

  let task: Task;
  let omniVotingEscrowChild: Contract, l2LayerZeroBridgeForwarder: Contract;
  let input: OmniVotingEscrowChildDeployment;

  const LM_MULTISIG = '0xc38c5f97B34E175FFd35407fc91a937300E33860';

  // https://docs.layerzero.network/v1/developers/evm/technical-reference/mainnet/mainnet-addresses
  const MAINNET_LZ_CHAIN_ID = 101;
  // https://github.com/LayerZero-Labs/lz_gauges/blob/main/deployments/ethereum/OmniVotingEscrow.json#L2
  const MAINNET_TRUSTED_ENDPOINT = '0xE241C6e48CA045C7f631600a0f1403b2bFea05ad';

  before('run OmniVotingEscrowChild task', async () => {
    task = new Task('20230524-lz-omni-voting-escrow-child', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    omniVotingEscrowChild = await task.deployedInstance('OmniVotingEscrowChild');
    input = task.input() as OmniVotingEscrowChildDeployment;
  });

  before('setup contracts', async () => {
    const bridgeForwarderTask = new Task(
      '20230404-l2-layer0-bridge-forwarder',
      TaskMode.READ_ONLY,
      getForkedNetwork(hre)
    );
    l2LayerZeroBridgeForwarder = await bridgeForwarderTask.deployedInstance('L2LayerZeroBridgeForwarder');
  });

  before('setup accounts', async () => {
    deployer = (await ethers.getSigners())[0];
  });

  context('constructor', async () => {
    it('stores the endpoint', async () => {
      expect(await omniVotingEscrowChild.lzEndpoint()).to.equal(input.LayerZeroEndpoint);
    });

    it('stores the delegation hook', async () => {
      expect(await omniVotingEscrowChild.delegationHook()).to.equal(l2LayerZeroBridgeForwarder.address);
    });
  });

  context('setup and transfer ownership', async () => {
    it('wires trusted endpoint', async () => {
      await expect(omniVotingEscrowChild.getTrustedRemoteAddress(MAINNET_LZ_CHAIN_ID)).to.be.revertedWith(
        'LzApp: no trusted path record'
      );
      const encodedEndpoint = ethers.utils.defaultAbiCoder.encode(['bytes'], [MAINNET_TRUSTED_ENDPOINT]);
      await omniVotingEscrowChild.connect(deployer).setTrustedRemoteAddress(MAINNET_LZ_CHAIN_ID, encodedEndpoint);

      const remoteAddressBytes = await omniVotingEscrowChild.getTrustedRemoteAddress(MAINNET_LZ_CHAIN_ID);
      const decodedAddress = ethers.utils.defaultAbiCoder.decode(['bytes'], remoteAddressBytes)[0];

      expect(decodedAddress).to.be.eq(MAINNET_TRUSTED_ENDPOINT.toLowerCase());
    });

    it('transfer ownership to LM multisig', async () => {
      expect(await omniVotingEscrowChild.owner()).to.be.eq(deployer.address);

      await omniVotingEscrowChild.connect(deployer).transferOwnership(LM_MULTISIG);
      expect(await omniVotingEscrowChild.owner()).to.be.eq(LM_MULTISIG);
    });
  });
});
