# 2025-02-21 - V3 Protocol Fee Controller Migration

Deployment of the `ProtocolFeeControllerMigration` contract, responsible for migrating the ProtocolFeeController from the original deployed version to a new version with extra events and features designed to make future migrations easier. This tests *two* migrations - the first upgrades the contract from the originally deployed ProtocolFeeController, which doesn't have the new infrastructure (specifically, getters for the pool creator fee percentages). This migration ignores pool creator percentages (which is fine because at this point there aren't any).

We then simulate a second migration, this time using the full infrastructure in the new contract, including the pool creator fee getters. To ensure this works, we deploy a pool with a creator, set a fee, and check that it gets migrated properly. (To do this in the fork test, we need a special version of the WeightedPoolFactory that allows pool creators.)

## Useful Files

- [`ProtocolFeeControllerMigration` artifact](./artifact/ProtocolFeeControllerMigration.json)
- [`WeightedPoolFactory` artifact](./artifact/WeightedPoolFactory.json)
