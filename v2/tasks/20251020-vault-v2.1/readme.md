# 2025-10-20 Vault v2.1

Deployment of a patched version of the Vault, Balancer V2's core contract, for new L2s that require veBAL infrastructure (e.g., Plasma).

The patch addresses the two known vulnerabilities discovered since the original deployment in 2021.

1) Token front-running: due to a gas optimization that removed a required check to ensure internal balances could only be created for deployed tokens as disclosed [here](https://forum.balancer.fi/t/balancer-v2-token-frontrun-vulnerability-disclosure/6309).
2) Read-only reentrancy: due to a violation of the checks/effects/interactions pattern in returning native ETH. See [here](https://forum.balancer.fi/t/reentrancy-vulnerability-scope-expanded/4345).

It also extends the pause window to match V3.

## Useful Files

- [Code](https://github.com/balancer/balancer-v2-monorepo/commit/febdff69169d2927e662cc92a713b5c528b0fa9b).
- [Plasma mainnet addresses](./output/plasma.json)
- [`Vault` artifact](./artifact/Vault.json)
- [`BalancerQueries` artifact](./artifact/BalancerQueries.json)
