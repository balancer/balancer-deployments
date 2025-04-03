# 2025-02-12 - MEV Capture Hook

MEV Capture Hook deployment. This hook increases the dynamic swap fee of pools using it when priority gas fees spike beyond a configurable threshold.
This contract is targeted for Base and L2 networks in general, where the priority gas fee determines the relative order of the transactions within a block.

## Useful Files

- Code [link](https://github.com/balancer/balancer-v3-monorepo/commit/02de03d6a7125aa11577b8d747b908f232655884).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`MevCaptureHook` artifact](./artifact/MevCaptureHook.json)
