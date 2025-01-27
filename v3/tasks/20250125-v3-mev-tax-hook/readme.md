# 2025-01-25 - MEV Tax Hook

MEV Tax Hook deployment. This hook increases the dynamic swap fee of pools using it when priority gas fees spike beyond a configurable threshold.
This contract is targeted for Base and L2 networks in general, where the priority gas fee determines the relative order of the transactions within a block.

## Useful Files

- Code [link](https://github.com/balancer/balancer-v3-monorepo/commit/11ac09bcb60811403475b54285d8acaef917bd2c).
- [Sepolia testnet addresses](./output/sepolia.json)
- [`MevTaxHook` artifact](./artifact/MevTaxHook.json)
