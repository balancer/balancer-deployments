# 2025-09-19 - V3 Protocol Fee Helper V2

This second deployment of the Protocol Fee Helper contract enables granular control over the power to set protocol swap and yield fees on pools. It maintains multiple sets of registered pools whose protocol fees can be set by authorized accounts. In contrast to the first version, governance only needs to grant this contract permission to set protocol fees on pools. The protocol fee helper is deployed with an admin account (e.g., the Maxi's multisig), which has the sole power to manage allowlists for partners and assign them initial managers. Thereafter, managers can set the protocol fees for pools in their respective allowlists, and transfer that authority to successor managers: all without involving Balancer governance.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/3ee90727e175957fda6daa231c984a2fffba2a02)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Plasma mainnet addresses](./output/plasma.json)
- [X-Layer mainnet addresses](./output/xlayer.json)
- [Monad mainnet addresses](./output/monad.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`ProtocolFeeHelper` artifact](./artifact/ProtocolFeeHelper.json)
