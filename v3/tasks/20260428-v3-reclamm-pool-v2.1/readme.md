# 2026-04-28 - V3 Readjusting Concentrated Liquidity AMM (ReClAMM) - V2.1

Deployment of `ReClammPoolFactory`, a new pool type that implements concentrated liquidity by imposing price bounds on the constant product "weighted" math curve (using virtual balances). Current approaches to CL require active management of the position by the user: either by adjusting "ticks" in a Uniswap-style non-fungible position, or by adding/removing liquidity with fungible approaches. The ReClamm uses algorithmic virtual balance modifications to internally and automatically adjust the price interval as needed.

This deployment patches unauthorized executions for hook functions (`onBeforeInitialze`, `onBeforeAddLiquidity` and `onBeforeRemoveLiquidity`), introduces stricter guardrails for pool admin settings, and incorporates minor stability fixes. Core mechanics remain the same. It also has a longer pause window.

## Useful Files

- [Code](https://github.com/balancer/reclamm/commit/8b48db4f6b6f7104bd1638b63c049a979affb9d2)
- [`ReClammPoolFactory` artifact](./artifact/ReClammPoolFactory.json)
- [`ReClammPool` artifact](./artifact/ReClammPool.json)
