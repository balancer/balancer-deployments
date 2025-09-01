# 2025-04-09 - V3 Readjusting Concentrated Liquidity AMM (ReClAMM)

> ⚠️ **DEPRECATED: do not use** ⚠️
>
> This version was superseded by [`ReClamm V2`](../../tasks/20250702-v3-reclamm-pool-v2/), which implements better guardrails against edge cases and stricter limits for admin settings. This factory can still be used, although high centeredness margins (> 90%) and high shift daily rates (> 100%) are discouraged.

Deployment of `ReClammPoolFactory`, a new pool type that implements concentrated liquidity by imposing price bounds on the constant product "weighted" math curve (using virtual balances). Current approaches to CL require active management of the position by the user: either by adjusting "ticks" in a Uniswap-style non-fungible position, or by adding/removing liquidity with fungible approaches. The ReClamm uses algorithmic virtual balance modifications to internally and automatically adjust the price interval as needed, 

## Useful Files

- [Code](https://github.com/balancer/reclamm/commit/61512d4737a69ca5b703842d058252585cfca381)
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
