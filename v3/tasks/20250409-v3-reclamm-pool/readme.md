# 2025-04-09 - V3 Readjusting Concentrated Liquidity AMM (ReClAMM)

Deployment of `ReClammPoolFactory`, a new pool type that implements concentrated liquidity by imposing price bounds on the constant product "weighted" math curve (using virtual balances). Current approaches to CL require active management of the position by the user: either by adjusting "ticks" in a Uniswap-style non-fungible position, or by adding/removing liquidity with fungible approaches. The ReClamm uses algorithmic virtual balance modifications to internally and automatically adjust the price interval as needed, 

## Useful Files

- [Code](https://github.com/balancer/reclamm/commit/dd1195f0610b11008b4acc0134fd9e9f79694b0a)
- [`ReClammPoolFactory` artifact](./artifact/ReClammPoolFactory.json)
