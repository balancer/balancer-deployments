# 2025-10-20 Vault v2.1

Deployment of a patched version of the Vault, Balancer V2's core contract, for new L2s that require veBAL infrastructure (e.g., Plasma).

The patch addresses the two known vulnerabilities discovered since the original deployment in 2021.

1) Token front-running: due to a gas optimization that removed a required check to ensure internal balances could only be created for deployed tokens.
2) Read-only reentrancy: due to a violation of the checks/effects/interactions pattern in returning native ETH. See https://forum.balancer.fi/t/reentrancy-vulnerability-scope-expanded/4345

It also extends the pause window to match V3.

## Useful Files

- [Code](https://github.com/balancer/balancer-v2-monorepo/commit/bddbc1016a30038e60041ddd2f66e9862107c729).
- [`Vault` artifact](./artifact/Vault.json)
- [`BalancerHelpers` artifact](./artifact/BalancerHelpers.json)
