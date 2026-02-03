# 2026-02-03 - V3 Stable Pool Oracle (V2)

Second deployment of the `StableLPOracle` and its corresponding `StableLPOracleFactory`.
These contracts provide a manipulation-resistant mechanism to compute the market price of LP tokens from stable pools given market price feeds for each of the tokens registered in the pool.

This version enables a flag which, when set on oracle deployment, makes all TVL-related calls revert when the Vault is unlocked. This is one strategy for preventing manipulations on the lending protocol side through the "infinite BPT mint" available during transient operations, in case the lending protocol does not have any caps imposed natively.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/7b737758699f276ccc8facb98bbd42fa2a594258).
- [`StableLPOracle` artifact](./artifact/StableLPOracle.json)
- [`StableLPOracleFactory` artifact](./artifact/StableLPOracleFactory.json)
