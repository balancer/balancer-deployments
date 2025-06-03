# 2025-06-02 - V3 LBP Migration Router

Contains `LBPMigrationRouter` for migrating LBPs into new weighted pools. 

The `LBPMigrationRouter` contract helps migrate a LBP into a new weighted pool. It first creates a new weighted pool with custom weights. 
Then, it withdraws liquidity from the LBP proportionally and uses the received tokens to join the new pool.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/f2c6974b4f3b503422ca99061df2af559970f135).
- [`LBPMigrationRouter` artifact](./artifact/LBPMigrationRouter.json)
