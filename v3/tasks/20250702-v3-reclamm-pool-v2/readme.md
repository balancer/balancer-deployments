# 2025-07-02 - V3 Readjusting Concentrated Liquidity AMM (ReClAMM) - V2

Deployment of `ReClammPoolFactory`, a new pool type that implements concentrated liquidity by imposing price bounds on the constant product "weighted" math curve (using virtual balances). Current approaches to CL require active management of the position by the user: either by adjusting "ticks" in a Uniswap-style non-fungible position, or by adding/removing liquidity with fungible approaches. The ReClamm uses algorithmic virtual balance modifications to internally and automatically adjust the price interval as needed.

This deployment implements protections against edge cases (no operations for long periods of time while out of target range), as well as stricter limits for admin settings:
- Max margin: 100% --> 90%
- Max shift daily rate: 300% --> 100%

Internal mechanics and pool math remain the same as the previous version, which can still be used with due caution.

## Useful Files

- [Code](https://github.com/balancer/reclamm/commit/7f33fe215df39cd39144c841266df4cea9b094ab)
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`ReClammPoolFactory` artifact](./artifact/ReClammPoolFactory.json)
- [`ReClammPool` artifact](./artifact/ReClammPool.json)
