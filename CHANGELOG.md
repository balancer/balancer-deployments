# Changelog

## Unreleased

### Breaking changes

- The `20221205-l2-gauge-checkpointer` task was deleted and replaced with `20230527-l2-gauge-checkpointer`. The old task had not been used by anyone.

### New Deployments

- Deployed `TimelockAuthorizer` and `TimelockAuthorizerMigrator` to Goerli.
- Deployed `BatchRelayerLibrary` V5 to all networks.
- Deployed `L2BalancerPseudoMinter` to all networks except Ethereum.
- Deployed `VotingEscrowDelegationProxy` and `NullVotingEscrow` to all networks except Ethereum.
- Deployed `WeightedPoolFactory` V4 to all networks.
- Deployed `ComposableStablePoolFactory` V4 to all networks.
- Deployed `ChildChainGaugeFactory` and `ChildChainGauge` to all networks except Ethereum.
- Deployed `L2LayerZeroBridgeForwarder` to all networks except Ethereum.
- Deployed `ManagedPoolFactory` V2 to all networks.
- Deployed `AuthorizerWithAdaptorValidation` to all networks.
- Deployed `ERC4626LinearPoolFactoryV4` to Mainnet, Polygon, Optimism, Arbitrum and Avalanche.
- Deployed `YearnLinearPoolFactoryV2` to Mainnet, Polygon, Arbitrum and Optimism.
- Deployed `AaveLinearPoolFactoryV5` to all networks.
- Deployed `GearboxLinearPoolFactoryV2` to Mainnet.
- Deployed `SiloLinearPoolFactoryV2` to Goerli and Mainnet.
- Deployed `PolygonZkEVMRootGaugeFactory` to Mainnet.
- Deployed `VotingEscrowRemapper` and `OmniVotingEscrowAdaptor` to Goerli, Sepolia and Mainnet.
- Deployed `GaugeAdder` V4 to Goerli, Sepolia and Mainnet.
- Deployed `VeBoostV2` to Polygon, Arbitrum, Optimism, Gnosis, Avalanche and zkEVM.
- Deployed `L2GaugeCheckpointer` to Mainnet.
- Deployed `GaugeWorkingBalanceHelper` to all networks.
- Deployed `AvalancheRootGaugeFactory` to Mainnet.
- Deployed `BalancerPoolDataQueries` to all networks.
- Deployed `TimelockAuthorizer` to Sepolia.
- Deployed `ComposableStablePoolFactory` V5 to all networks.
- Deployed `ChildChainGaugeCheckpointer` (Balancer relayer v5.1) to all networks except Ethereum.
- Deployed `ChainlinkRateProviderFactory` to all networks.
- Deployed `StakelessGaugeCheckpointer` to Ethereum and Sepolia.

### Deprecations

- Deprecated `20221202-timelock-authorizer`.
- Deprecated `20220916-batch-relayer-v4`.
- Deprecated `20230109-gauge-adder-v3`.
- Deprecated `20230206-aave-rebalanced-linear-pool-v4`.
- Deprecated `20230206-composable-stable-pool-v3`.
- Deprecated `20230206-erc4626-linear-pool-v3`.
- Deprecated `20230206-weighted-pool-v3`.
- Deprecated `20230213-gearbox-linear-pool`.
- Deprecated `20230213-yearn-linear-pool`.
- Deprecated `20230315-silo-linear-pool`.
- Deprecated `20230320-composable-stable-pool-v4`.
- Deprecated `20230316-avax-l2-balancer-pseudo-minter` and `20230316-avax-child-chain-gauge-factory-v2` (initial version for `L2BalancerPseudoMinter` and `ChildChainGaugeFactory` for Avalanche).
- Deprecated `20230527-l2-gauge-checkpointer`.

### New Networks

- Deployed all L2 contracts to Avalanche.
- Deployed all contracts on Goerli to Sepolia.
- Deployed all L2 contracts to Polygon zkEVM.

## 3.2.0 (2023-02-24)

### New Deployments

- Deployed `WeightedPoolFactory` v3 to all networks.
- Deployed `ComposableStablePoolFactory` v3 to all networks.
- Deployed `L2GaugeCheckpointer` to Mainnet.
- Deployed `VeBoostV2` to Mainnet.
- Deployed `NoProtocolFeeLiquidityBootstrappingPoolFactory` to Gnosis.
- Deployed `ERC4626LinearPoolFactory` to Gnosis.
- Deployed `UnbuttonAaveLinearPoolFactory` to Gnosis.
- Deployed `StablePoolFactory` to Gnosis.
- Deployed `WeightedPoolFactory` to Gnosis.
- Deployed `ComposableStablePoolFactory` to Gnosis.
- Deployed `PoolRecoveryHelper` to Gnosis.
- Deployed `AaveLinearPoolFactory` to Gnosis.
- Deployed `GaugeAdderV3` to Mainnet and Goerli.
- Deployed `TimelockAuthorizerTransitionMigrator` to Mainnet.
- Deployed `AaveLinearPoolV4` to all networks.
- Deployed `ERC4626LinearPoolFactory` to Mainnet, Goerli, Arbitrum, Polygon, and Optimism.
- Deployed `EulerLinearPoolFactory` to Mainnet and Goerli.
- Deployed `YearnLinearPoolFactory` to Mainnet, Goerli, Arbitrum, Polygon, and Optimism.
- Deployed `GearboxLinearPoolFactory` to Mainnet and Goerli.
- Deployed `ChildChainLiquidityGaugeFactory`, `ChildChainStreamer`, and `RewardsOnlyGauge` to Gnosis.
- Deployed `ChildChainGaugeTokenAdder` to Gnosis.
- Deployed `ChildChainGaugeRewardHelper` to Gnosis.
- Deployed `GnosisRootGaugeFactory` to Mainnet.
- Deployed `MerkleOrchard` V2 to Mainnet, Goerli, Arbitrum and Polygon.
- Deployed `SingleRecipientGaugeFactory` V2 to Mainnet and Goerli.
- Deployed `ProtocolIdRegistry` to Mainnet, Goerli, Arbitrum, Polygon, Optimism and Gnosis.

### Deprecations

- Deprecated `20221207-aave-rebalanced-linear-pool-v3`.
- Deprecated `20220425-unbutton-aave-linear-pool`.
- Deprecated `20220404-erc4626-linear-pool-v2`.
- Deprecated `20220325-gauge-adder`.
- Deprecated `20220628-gauge-adder-v2`.

### Breaking Changes

- The `20221115-aave-rebalanced-linear-pool` task was deleted and replaced with `20221207-aave-rebalanced-linear-pool-v3`. The old task had not been used by anyone.

## 3.1.1 (2022-12-01)

### Bugfixes

- Fixed changelog.

## 3.1.0 (2022-12-01)

### New Deployments

- Deployed core infrastructure (`Authorizer`, `Vault`, `AuthorizerAdaptor`, `ProtocolFeeWithdrawer`, `ProtocolFeePercentagesProvider`, `BalancerQueries` and `BatchRelayer`) to Gnosis and BNB.
- Deployed core Pool factories (`WeightedPoolFactory`, `ComposableStablePoolFactory`, `LiquidityBootstrappingPool`, `AaveLinearPool`) to BNB.
- Deployed `AuthorizerAdaptorEntrypoint` to all networks.
- Deployed `AaveLinearPoolFactory` to all networks.
- Deployed `PoolRecoveryHelper` to all networks.
- Deployed `ComposableStablePoolFactory` to all networks.
- Deployed `TimelockAuthorizer` to ethereum mainnet and goerli.

### Deprecations

- Deprecated `20211021-managed-pool` due to lacking features and not being expected to ever be used. A new version will be released soon.

### API Changes

- Made `getBalancerContractAbi`, `getBalancerContractBytecode`, `getBalancerContractAddress` and `getBalancerDeployment` synchronous rather than asynchronous functions.
- Added `getBalancerContractArtifact` which returns a artifact file for the contract in the same format used by Hardhat.
- Deprecated `getBalancerContractBytecode` in favour of `getBalancerContractArtifact`.
- Added `lookupBalancerContractByAddress` which returns the contract's name and the relevant deployment task if it is a tracked Balancer contract.

## 3.0.0 (2022-10-25)

### New Deployments

- All deployments that occurred since September 2021, including Linear Pools, Liquidity Mining, Composable Stable Pools and Managed Pools.

### Breaking Changes

- Introduced the `deprecated` directory. Deployments may be moved to that directory in minor releases - this will not be considered a breaking change.

## 2.3.0 (2021-09-24)

### New Deployments

- Deployed `InvestmentPoolFactory` to Mainnet, Polygon and Arbitrum.
- Deployed `MerkleRedeem` to Mainnet for VITA distribution.
- Deployed `MerkleRedeem` to Arbitrum for BAL distribution.

## 2.2.0 (2021-09-15)

### New Features

- Added creation code in the `bytecode` directory of each task.
- Added `getBalancerContractBytecode` to get a contract's creation code, which makes deploying contracts easier to package users.

## 2.1.3 (2021-08-30)

### Fixes

- Fixed inconsistent JSON file loading semantics.

## 2.1.2 (2021-08-30)

### Fixes

- Fixed package paths in published contract loaders.

## 2.1.1 (2021-08-25)

### Fixes

- Added `BalancerHelpers` to the Arbitrum deployment.

## 2.1.0 (2021-08-24)

### New Deployments

- Deployed `Authorizer`, `Vault`, `WeightedPoolFactory`, `WeightedPool2TokensFactory`, `StablePoolFactory`, `LiquidityBootstrappingPoolFactory`, `MetaStablePoolFactory` on Arbitrum mainnet.

## 2.0.0 (2021-08-24)

### New Deployments

- `StablePoolFactory`
- `LiquidityBootstrappingPoolFactory`
- `MetaStablePoolFactory`
- `MerkleRedeem` (for the LDO token)
- `LidoRelayer`
- `WstETHRateProvider`

### Breaking Changes

This release changes the directory structure of the package and introduces the concept of 'tasks'. Refer to [the readme](./README.md) for more information on where artifacts are located, and the different task IDs.
