# 2026-02-09 - V3 Gyro E-CLP Oracle

Deployment of `EclpLPOracle` and its corresponding `EclpLPOracleFactory`.
These contracts provide a manipulation-resistant mechanism to compute the market price of LP tokens from Gyro E-CLP pools given market price feeds for each of the tokens registered in the pool.
It also increases price stability by ensuring the very latest rates are applied during TVL calculation.

Additionally, it provides sequencer uptime grace periods (1 hour) for L2 networks that rely on them (e.g. Arbitrum, Optimism, Base).

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/c1cd3696c3627bfe93f66f6aa175b9ad894c3e4a).
- [Ethereum mainnet addresses](./output/mainnet.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Base mainnet addresses](./output/base.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Hyperevm mainnet addresses](./output/hyperevm.json)
- [Plasma mainnet addresses](./output/plasma.json)
- [X-Layer mainnet addresses](./output/xlayer.json)
- [Monad mainnet addresses](./output/monad.json)
- [Sepolia testnet addresses](./output/sepolia.json)
- [`EclpLPOracle` artifact](./artifact/EclpLPOracle.json)
- [`EclpLPOracleFactory` artifact](./artifact/EclpLPOracleFactory.json)
