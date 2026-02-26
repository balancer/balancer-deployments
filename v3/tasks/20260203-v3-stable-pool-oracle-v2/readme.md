# 2026-02-03 - V3 Stable Pool Oracle (V2)

Second deployment of the `StableLPOracle` and its corresponding `StableLPOracleFactory`.
These contracts provide a manipulation-resistant mechanism to compute the market price of LP tokens from stable pools given market price feeds for each of the tokens registered in the pool.

This version enables a flag which, when set on oracle deployment, makes all TVL-related calls revert when the Vault is unlocked. This is one strategy for preventing manipulations on the lending protocol side through the "infinite BPT mint" available during transient operations, in case the lending protocol does not have any caps imposed natively. It also increases price stability by ensuring the very latest rates are applied during TVL calculation.

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
- [`StableLPOracle` artifact](./artifact/StableLPOracle.json)
- [`StableLPOracleFactory` artifact](./artifact/StableLPOracleFactory.json)
