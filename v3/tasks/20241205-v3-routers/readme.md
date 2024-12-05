# V3 Routers

Base Router set deployment for V3.
Contains:
- `Router` for basic, single step operation (pool initialization, add, remove, swap).
- `BatchRouter` for complex multi step swaps (supports single token add / remove types and buffer wrap / unwrap).
- `CompositeLiquidityRouter` for complex liquidity operations involving pools with ERC4626 wrappers and nested pools.
- `BufferRouter` to initialize and manage liquidity positions for buffers.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/74d7068fb21565741427cdabfa4f1b539a4bddaa).
- [Sepolia testnet addresses](./output/sepolia.json)
- [`Router` artifact](./artifact/Router.json)
- [`BatchRouter` artifact](./artifact/BatchRouter.json)
- [`CompositeLiquidityRouter` artifact](./artifact/CompositeLiquidityRouter.json)
- [`BufferRouter` artifact](./artifact/BufferRouter.json)

