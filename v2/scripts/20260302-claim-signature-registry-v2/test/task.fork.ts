import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '@src';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describeForkTest('ClaimSignatureRegistryV2', 'mainnet', 24572000, function () {
  let task: Task;
  let signer: SignerWithAddress;
  let claimSignatureRegistry: Contract;

  const message: string =
    'I accept the T&Cs applicable to this claim, incl. all provisions of the Balancer ToU & all relevant Balancer governance resolutions.\n\n' +
    'I acknowledge & agree that my acceptance constitutes a full & final settlement & release of any & all past, present, & future claims, liabilities, demands, actions, causes of action, damages, or losses of any kind -whether known or unknown- arising out of or related to the Balancer V2 exploit.\n\n' +
    'This waiver expressly incl. claims against the Balancer Foundation, Balancer OpCo Ltd., Balancer Onchain Ltd. & all affiliated entities, as well as their respective officers, directors, contributors, service providers, employees, contractors, advisors, agents, successors, & assigns (collectively, the "Released Parties").\n\n' +
    'I acknowledge the limitation of liability, mandatory arbitration & all risk disclosures set forth in the Balancer ToU.\n\n' +
    'I waive & relinquish any right to participate in any class or collective action related to the V2 exploit or the Balancer Protocol.\n\n' +
    'I acknowledge & agree to the SEAL Safe Harbor Agreement (approved by governance resolution) which can offer legal protection to whitehats who aid in the recovery of assets during an active exploit.\n\n' +
    'I understand that my claim will not be processed unless I accept these terms in full & without modification.';

  // Remove last character to make it different
  const notAcceptedMessage: string = message.substring(0, message.length - 1);

  before('run task', async () => {
    task = new Task('20260302-claim-signature-registry-v2', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    claimSignatureRegistry = await task.deployedInstance('ClaimSignatureRegistry');
  });

  before('get signer', async () => {
    signer = await getSigner();
  });

  it('stores signature', async () => {
    const signature = await signer.signMessage(message);
    await expect(claimSignatureRegistry.connect(signer).recordSignature(signature)).to.not.be.reverted;

    const storedSignature = await claimSignatureRegistry.signatures(signer.address);
    expect(storedSignature).to.equal(signature);
  });

  it('does not accept signatures for other messages', async () => {
    const signature = await signer.signMessage(notAcceptedMessage);
    await expect(claimSignatureRegistry.connect(signer).recordSignature(signature)).to.be.reverted;
  });
});
