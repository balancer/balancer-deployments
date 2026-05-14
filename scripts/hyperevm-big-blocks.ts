// Hardhat task: toggle HyperEVM "big blocks" mode for the deployer EOA.
//
// HyperEVM produces small blocks (~1s, 2M gas) by default. Deployments whose
// gas exceeds that limit are rejected with "exceeds block gas limit" until
// the deployer EOA opts into big blocks (~60s, 30M gas) via a Hyperliquid
// L1 user action. Flip on, deploy, flip off.
//
// Usage:
//   npx hardhat hyperevm-big-blocks --enable  --network hyperevm
//   npx hardhat hyperevm-big-blocks --disable --network hyperevm

import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const HL_MAINNET_API = 'https://api.hyperliquid.xyz/exchange';

task('hyperevm-big-blocks', 'Toggle HyperEVM big-blocks mode for the deployer EOA')
  .addFlag('enable', 'Turn big blocks on')
  .addFlag('disable', 'Turn big blocks off')
  .setAction(async (args: { enable: boolean; disable: boolean }, hre: HardhatRuntimeEnvironment) => {
    if (hre.network.name !== 'hyperevm') {
      throw new Error(`Must be run with --network hyperevm (got ${hre.network.name})`);
    }
    if (args.enable === args.disable) {
      throw new Error('Specify exactly one of --enable or --disable');
    }
    const usingBigBlocks = args.enable;

    const [signer] = await hre.ethers.getSigners();
    const address = await signer.getAddress();
    console.log(`${usingBigBlocks ? 'Enabling' : 'Disabling'} big blocks for ${address}`);

    const action = { type: 'evmUserModify', usingBigBlocks };
    const nonce = Date.now();

    // action_hash = keccak256(msgpack(action) || nonce_be_8 || vault_byte)
    const actionBytes = msgpackEncodeEvmUserModify(usingBigBlocks);
    const nonceBytes = Buffer.alloc(8);
    nonceBytes.writeBigUInt64BE(BigInt(nonce));
    const vaultBytes = Buffer.from([0x00]); // no vault
    const connectionId = hre.ethers.keccak256(Buffer.concat([actionBytes, nonceBytes, vaultBytes]));

    // EIP-712 over the "Agent" phantom domain. chainId is always 1337 for L1
    // actions; source "a" = mainnet, "b" = testnet.
    const domain = {
      name: 'Exchange',
      version: '1',
      chainId: 1337,
      verifyingContract: '0x0000000000000000000000000000000000000000',
    };
    const types = {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' },
      ],
    };
    const message = { source: 'a', connectionId };

    const rawSig = await signer.signTypedData(domain, types, message);
    const sig = hre.ethers.Signature.from(rawSig);

    const payload = {
      action,
      nonce,
      signature: { r: sig.r, s: sig.s, v: sig.v },
      vaultAddress: null,
    };

    const res = await fetch(HL_MAINNET_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (body.status !== 'ok') {
      throw new Error(`Hyperliquid API rejected the request: ${JSON.stringify(body)}`);
    }
    console.log(`OK — big blocks ${usingBigBlocks ? 'enabled' : 'disabled'} for ${address}`);
    console.log(JSON.stringify(body, null, 2));
  });

// Inline msgpack for {type: "evmUserModify", usingBigBlocks: <bool>} so we
// don't need a runtime msgpack dep for one fixed action shape.
function msgpackEncodeEvmUserModify(usingBigBlocks: boolean): Buffer {
  return Buffer.concat([
    Buffer.from([0x82]), //                       fixmap, 2 entries
    Buffer.from([0xa4]),
    Buffer.from('type'), //  fixstr(4)
    Buffer.from([0xad]),
    Buffer.from('evmUserModify'), //   fixstr(13)
    Buffer.from([0xae]),
    Buffer.from('usingBigBlocks'), //  fixstr(14)
    Buffer.from([usingBigBlocks ? 0xc3 : 0xc2]), // true / false
  ]);
}
