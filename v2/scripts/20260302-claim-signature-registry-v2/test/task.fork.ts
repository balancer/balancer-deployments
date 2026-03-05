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
    "I ACCEPT BALANCER'S T&C APPLICABLE TO THIS CLAIM, INCL. ALL PROVISIONS OF THE ToU AND RELEVANT GOV RESOLUTIONS, INCL. LIMITATION OF LIABILITY, MANDATORY ARBITRATION AND RISK DISCLOSURES. I HEREBY CONFIRM & AGREE TO THE FOLLOWING:\n\n" +
    'My acceptance constitutes full final settlement & release of any past, present, & future claims, liabilities, demands, actions, causes of action, damages, or losses of any kind, known or unknown, arising out of or related to the Balancer exploit.\n' +
    'This waiver incl. claims and any right to participate in any class or collective action against the Balancer Foundation & all affiliated entities, as well as their respective officers, directors, contributors, service providers, employees, contractors, advisors, agents, successors, & assigns.\n' +
    'I acknowledge & agree to the Safe Harbor Agreement in all its terms (as approved by Balancer governance resolution).\n' +
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
