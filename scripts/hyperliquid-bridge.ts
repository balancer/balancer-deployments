// Hardhat task: deposit native USDC from the Arbitrum-side deployer into
// Hyperliquid Bridge2, crediting the same address on HyperCore.
//
// Why: bypasses the Hyperliquid website's T&C / geo-block flow. The bridge
// is just an ERC20 transfer to a fixed contract; the validators credit the
// sender's address on HyperCore in under a minute.
//
// Prerequisite: the same deployer EOA must hold native USDC on Arbitrum
// (NOT USDC.e — see the address constant below) and be configured as the
// signer for the `arbitrum` network in ~/.hardhat/networks.json.
//
// Usage:
//   npx hardhat hl-deposit --amount 5 --network arbitrum
//
// Bridge2 reference:
//   https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2

import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const BRIDGE2 = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';
const USDC_NATIVE_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const USDC_E_ARBITRUM = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'; // old bridged, NOT accepted
const USDC_DECIMALS = 6;
const MIN_USDC = 5n; // hard floor; anything less is lost per the docs

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
];

task('hl-deposit', 'Deposit USDC to Hyperliquid Bridge2 on Arbitrum (creates the HyperCore account for the sender)')
  .addParam('amount', 'USDC amount in whole units (minimum 5)')
  .setAction(async (args: { amount: string }, hre: HardhatRuntimeEnvironment) => {
    const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);
    if (chainId !== 42161) {
      throw new Error(`Must be run with --network arbitrum (chainId 42161, got ${chainId})`);
    }

    const amountWhole = BigInt(args.amount);
    if (amountWhole < MIN_USDC) {
      throw new Error(
        `Amount ${amountWhole} USDC is below the 5 USDC minimum. Anything less is lost forever per Hyperliquid docs.`
      );
    }
    const amountUnits = amountWhole * 10n ** BigInt(USDC_DECIMALS);

    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    const usdc = new hre.ethers.Contract(USDC_NATIVE_ARBITRUM, ERC20_ABI, signer);
    const balance: bigint = await usdc.balanceOf(address);

    console.log(`From:    ${address}`);
    console.log(`Bridge:  ${BRIDGE2}`);
    console.log(`USDC:    ${USDC_NATIVE_ARBITRUM}  (native USDC on Arbitrum)`);
    console.log(`Amount:  ${amountWhole} USDC  (${amountUnits} units)`);
    console.log(`Balance: ${balance / 10n ** BigInt(USDC_DECIMALS)} USDC  (${balance} units)`);

    if (balance < amountUnits) {
      const usdcE = new hre.ethers.Contract(USDC_E_ARBITRUM, ERC20_ABI, signer);
      const usdcEBal: bigint = await usdcE.balanceOf(address);
      const hint =
        usdcEBal > 0n
          ? `\n\nYou hold ${
              usdcEBal / 10n ** BigInt(USDC_DECIMALS)
            } USDC.e at ${USDC_E_ARBITRUM} — that is the OLD bridged USDC and the Hyperliquid bridge does not accept it. Swap to native USDC (${USDC_NATIVE_ARBITRUM}) first.`
          : '';
      throw new Error(`Insufficient native USDC.${hint}`);
    }

    console.log(`\nSubmitting transfer...`);
    const tx = await usdc.transfer(BRIDGE2, amountUnits);
    console.log(`Tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Confirmed in block ${receipt?.blockNumber}`);
    console.log(
      `Credit on HyperCore typically lands in <1 minute. Verify the address shows up at https://app.hyperliquid.xyz before running hyperevm-big-blocks.`
    );
  });
