# 2025-12-19 - V3 Liquidity Bootstrapping Pool (V3)

Third deployment for the LBPool, a Weighted Pool with mutable weights, designed to support v3 Liquidity Bootstrapping.

This deployment includes the ability to launch "Seedless" LBPs: pools where no reserve tokens are required. This is accomplished by passing a non-zero "virtual reserve balance" on creation, then initializing with only project tokens. If the LBP allows selling project tokens back into the pool, these operations will fail unless project token sales have added sufficient "real" reserve tokens to fund them.

If this virtual reserve balance parameter is 0, it will create a standard "Seeded" LBP.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/316ded078ddc2f1b28da5804d25752af67453435)
- [`LBPoolFactory` artifact](./artifact/LBPoolFactory.json)
- [`LBPool` artifact](./artifact/LBPool.json)
- [`LBPMigrationRouter` artifact](./artifact/LBPMigrationRouter.json)
- [`BPTTimeLocker` artifact](./artifact/BPTTimeLocker.json)
