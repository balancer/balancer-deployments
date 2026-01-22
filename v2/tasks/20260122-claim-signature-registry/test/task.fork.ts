import hre from 'hardhat';
import { Contract } from 'ethers';
import { describeForkTest, getForkedNetwork, getSigner, Task, TaskMode } from '@src';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describeForkTest('ClaimSignatureRegistry', 'mainnet', 24291200, function () {
  let task: Task;
  let signer: SignerWithAddress;
  let claimSignatureRegistry: Contract;

  const message =
    "I confirm and agree to the following:\n- I accept the terms and conditions applicable to this claim, including all provisions of the Balancer Terms of Use and all relevant Balancer governance resolutions.\n- I acknowledge and agree that my acceptance constitutes a full and final settlement and release of any and all past, present, and future claims, liabilities, demands, actions, causes of action, damages, or losses of any kind-whether known or unknown-arising out of or related to the Balancer V2 exploit.\n- This waiver expressly includes claims against the Balancer Foundation, Balancer OpCo Limited, Balancer Onchain Limited and all affiliated entities, as well as their respective officers, directors, contributors, service providers, employees, contractors, advisors, agents, successors, and assigns (collectively, the 'Released Parties').\n- I acknowledge the limitation of liability, mandatory arbitration and all risk disclosures set forth in the Balancer Terms of Use.\n- I waive and relinquish any right to participate in any class or collective action related to the V2 exploit or the Balancer Protocol.\n- I acknowledge and agree to the SEAL Safe Harbor Agreement which was approved by governance resolution and can offer legal protection to whitehats who aid in the recovery of assets during an active exploit.- I understand that my claim will not be processed unless I accept these terms in full and without modification.";

  before('run task', async () => {
    task = new Task('20260122-claim-signature-registry', TaskMode.TEST, getForkedNetwork(hre));
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
});
