# 2025-01-17 - V3 Balancer Contract Registry

`BalancerContractRegistry` maintains a registry of official Balancer Factories, Routers, Hooks, and valid ERC4626 tokens, for two main purposes. The first is to support the many instances where we need to know that a contract is "trusted" (i.e., is safe and behaves in the required manner). The second use case is for off-chain queries, or other protocols that need to easily determine, say, the "latest" Weighted Pool Factory.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/b5298876aa5bd230d8ad8672731971aabf448746).
- [`BalancerContractRegistry` artifact](./artifact/BalancerContractRegistry.json)
