# 2025-04-09 - V3 Readjusting Concentrated Liquidity AMM (ReClAMM)

Deployment of `ReClammPoolFactory`, a new pool type that implements concentrated liquidity by imposing price bounds on the constant product "weighted" math curve (using virtual balances). Current approaches to CL require active management of the position by the user: either by adjusting "ticks" in a Uniswap-style non-fungible position, or by adding/removing liquidity with fungible approaches. The ReClamm uses algorithmic virtual balance modifications to internally and automatically adjust the price interval as needed, 

## Useful Files

- [Code](https://github.com/balancer/reclamm/pull/125/commits/07e2dec67d6d809521967514dc9f57988c8cd4ae)
- [`ReClammPoolFactory` artifact](./artifact/ReClammPoolFactory.json)
- [`ReClammPool` artifact](./artifact/ReClammPool.json)
