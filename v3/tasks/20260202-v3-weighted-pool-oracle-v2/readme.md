# 2026-02-02 - V3 Weighted Pool Oracle V2

Second deployment of `WeightedLPOracle` and its corresponding `WeightedLPOracleFactory`.
These contracts provide a manipulation-resistant mechanism to compute the market price of LP tokens from weighted pools given market price feeds for each of the tokens registered in the pool.

This version enables a flag which, when set on oracle deployment, makes all TVL-related calls revert when the Vault is unlocked. This is one strategy for preventing manipulations on the lending protocol side through the "infinite BPT mint" available during transient operations, in case the lending protocol does not have any caps imposed natively.

It also provides sequencer uptime grace periods (1 hour) for L2 networks that rely on them (e.g. Arbitrum, Optimism, Base).

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/7b737758699f276ccc8facb98bbd42fa2a594258).
- [`WeightedLPOracle` artifact](./artifact/WeightedLPOracle.json)
- [`WeightedLPOracleFactory` artifact](./artifact/WeightedLPOracleFactory.json)
