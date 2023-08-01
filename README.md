# <img src="logo.svg" alt="Balancer" height="128px">

# Balancer V2 Deployments

[![NPM Package](https://img.shields.io/npm/v/@balancer-labs/v2-deployments.svg)](https://www.npmjs.org/package/@balancer-labs/v2-deployments)
[![GitHub Repository](https://img.shields.io/badge/github-deployments-lightgrey?logo=github)](https://github.com/balancer-labs/balancer-v2-monorepo/tree/master/pkg/deployments)

This package contains the addresses and ABIs of all Balancer V2 deployed contracts for Ethereum mainnet, Polygon, Arbitrum, Optimism, Gnosis, BSC and Avalanche, as well as various test networks. Each deployment consists of a deployment script (called 'task'), inputs (script configuration, such as dependencies), outputs (typically contract addresses), ABIs and bytecode files of related contracts.

Addresses and ABIs can be consumed from the package in JavaScript environments, or manually retrieved from the [GitHub](https://github.com/balancer-labs/balancer-v2-monorepo/tree/master/pkg/deployments) repository.

Note that some protocol contracts are created dynamically: for example, `WeightedPool` contracts are deployed by the canonical `WeightedPoolFactory`. While the ABIs of these contracts are stored in the `abi` directory of each deployment, their addresses are not. Those can be retrieved by querying the on-chain state or processing emitted events.

## Overview

### Deploying Contracts

For more information on how to create new deployments or run existing ones in new networks, head to the [deployment guide](DEPLOYING.md).

### Installation

```console
$ npm install @balancer-labs/v2-deployments
```

### Usage

Import `@balancer-labs/v2-deployments` to access the different ABIs and deployed addresses. To see all current Task IDs and their associated contracts, head to [Active Deployments](#active-deployments).

Past deployments that are currently not in use or have been superseded can be accessed in the [Deprecated Deployments](#deprecated-deployments) section. Use `deprecated/` as prefix when referring to a deprecated task ID.

> ⚠️ Exercise care when interacting with deprecated deployments: there's often a very good reason why they're no longer active.
>
> You can find information on why each deployment has been deprecated in their corresponding readme file.

---

- **async function getBalancerContract(taskID, contract, network)**

Returns an [Ethers](https://docs.ethers.io/v5/) contract object for a canonical deployment (e.g. the Vault, or a Pool factory).

_Note: requires using [Hardhat](https://hardhat.org/) with the [`hardhat-ethers`](https://hardhat.org/plugins/nomicfoundation-hardhat-ethers.html) plugin._

- **async function getBalancerContractAt(taskID, contract, address)**

Returns an [Ethers](https://docs.ethers.io/v5/) contract object for a contract dynamically created at a known address (e.g. a Pool created from a factory).

_Note: requires using [Hardhat](https://hardhat.org/) with the [`hardhat-ethers`](https://hardhat.org/plugins/nomicfoundation-hardhat-ethers.html) plugin._

- **function getBalancerContractAbi(taskID, contract)**

Returns a contract's [ABI](https://docs.soliditylang.org/en/latest/abi-spec.html).

- **function getBalancerContractBytecode(taskID, contract)**

Returns a contract's [creation code](https://docs.soliditylang.org/en/latest/contracts.html#creating-contracts).

- **function getBalancerContractAddress(taskID, contract, network)**

Returns the address of a contract's canonical deployment.

- **function getBalancerDeployment(taskID, network)**

Returns an object with all contracts from a deployment and their addresses.

## Active Deployments

| Description                                            | Task ID                                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Authorizer, governance contract                        | [`20210418-authorizer`](./tasks/20210418-authorizer)                                                 |
| Vault, main protocol contract                          | [`20210418-vault`](./tasks/20210418-vault)                                                           |
| Rate Provider for wstETH                               | [`20210812-wsteth-rate-provider`](./tasks/20210812-wsteth-rate-provider)                             |
| Liquidity Bootstrapping Pools                          | [`20211202-no-protocol-fee-lbp`](./tasks/20211202-no-protocol-fee-lbp)                               |
| Authorizer Adaptor for extending governance            | [`20220325-authorizer-adaptor`](./tasks/20220325-authorizer-adaptor)                                 |
| Wallet for the BAL token                               | [`20220325-bal-token-holder-factory`](./tasks/20220325-bal-token-holder-factory)                     |
| Admin of the BAL token                                 | [`20220325-balancer-token-admin`](./tasks/20220325-balancer-token-admin)                             |
| Liquidity Mining: veBAL, Gauge Controller and Minter   | [`20220325-gauge-controller`](./tasks/20220325-gauge-controller)                                     |
| Test Balancer Token                                    | [`20220325-test-balancer-token`](./tasks/20220325-test-balancer-token)                               |
| Delegation of veBAL boosts                             | [`20220325-ve-delegation`](./tasks/20220325-ve-delegation)                                           |
| Gauges on child networks (L2s and sidechains)          | [`20220413-child-chain-gauge-factory`](./tasks/20220413-child-chain-gauge-factory)                   |
| veBAL Smart Wallet Checker                             | [`20220420-smart-wallet-checker`](./tasks/20220420-smart-wallet-checker)                             |
| Relayer with the fix for the Double Entrypoint issue   | [`20220513-double-entrypoint-fix-relayer`](./tasks/20220513-double-entrypoint-fix-relayer)           |
| Protocol Fee Withdrawer                                | [`20220517-protocol-fee-withdrawer`](./tasks/20220517-protocol-fee-withdrawer)                       |
| Child Chain Gauge Token Adder                          | [`20220527-child-chain-gauge-token-adder`](./tasks/20220527-child-chain-gauge-token-adder)           |
| Preseeded Voting Escrow Delegation                     | [`20220530-preseeded-voting-escrow-delegation`](./tasks/20220530-preseeded-voting-escrow-delegation) |
| Distribution Scheduler for reward tokens on gauges     | [`20220707-distribution-scheduler`](./tasks/20220707-distribution-scheduler)                         |
| Fee Distributor for veBAL holders V2                   | [`20220714-fee-distributor-v2`](./tasks/20220714-fee-distributor-v2)                                 |
| Swap, join and exit simulations (queries)              | [`20220721-balancer-queries`](./tasks/20220721-balancer-queries)                                     |
| Protocol fee percentages provider                      | [`20220725-protocol-fee-percentages-provider`](./tasks/20220725-protocol-fee-percentages-provider)   |
| Child Chain Gauge Reward Helper                        | [`20220812-child-chain-reward-helper`](./tasks/20220812-child-chain-reward-helper)                   |
| Mainnet Staking Gauges V2                              | [`20220822-mainnet-gauge-factory-v2`](./tasks/20220822-mainnet-gauge-factory-v2)                     |
| Arbitrum Root Gauges V2, for veBAL voting              | [`20220823-arbitrum-root-gauge-factory-v2`](./tasks/20220823-arbitrum-root-gauge-factory-v2)         |
| Optimism Root Gauges V2, for veBAL voting              | [`20220823-optimism-root-gauge-factory-v2`](./tasks/20220823-optimism-root-gauge-factory-v2)         |
| Polygon Root Gauges V2, for veBAL voting               | [`20220823-polygon-root-gauge-factory-v2`](./tasks/20220823-polygon-root-gauge-factory-v2)           |
| Pool Recovery Helper                                   | [`20221123-pool-recovery-helper`](./tasks/20221123-pool-recovery-helper)                             |
| Authorizer Adaptor Entrypoint                          | [`20221124-authorizer-adaptor-entrypoint`](./tasks/20221124-authorizer-adaptor-entrypoint)           |
| VeBoost V2                                             | [`20221205-veboost-v2`](./tasks/20221205-veboost-v2)                                                 |
| Linear Pools for Euler Tokens                          | [`20230208-euler-linear-pool`](./tasks/20230208-euler-linear-pool)                                   |
| Single Recipient Stakeless Gauges V2                   | [`20230215-single-recipient-gauge-factory`](./tasks/20230215-single-recipient-gauge-factory-v2)      |
| Gnosis Root Gauge, for veBAL voting                    | [`20230217-gnosis-root-gauge-factory`](./tasks/20230217-gnosis-root-gauge-factory)                   |
| Merkle Orchard Distributor V2                          | [`20230222-merkle-orchard-v2`](./tasks/20230222-merkle-orchard-v2)                                   |
| Protocol ID registry                                   | [`20230223-protocol-id-registry`](./tasks/20230223-protocol-id-registry)                             |
| Batch Relayer V5                                       | [`20230314-batch-relayer-v5`](./tasks/20230314-batch-relayer-v5)                                     |
| L2 Balancer Pseudo Minter                              | [`20230316-l2-balancer-pseudo-minter`](./tasks/20230316-l2-balancer-pseudo-minter)                   |
| Child Chain Gauge Factory V2                           | [`20230316-child-chain-gauge-factory-v2`](./tasks/20230316-child-chain-gauge-factory-v2)             |
| L2 Voting Escrow Delegation Proxy                      | [`20230316-l2-ve-delegation-proxy`](./tasks/20230316-l2-ve-delegation-proxy)                         |
| Weighted Pool V4                                       | [`20230320-weighted-pool-v4`](./tasks/20230320-weighted-pool-v4)                                     |
| L2 Layer0 Bridge Forwarder                             | [`20230404-l2-layer0-bridge-forwarder`](./tasks/20230404-l2-layer0-bridge-forwarder)                 |
| Linear Pools for ERC4626 Tokens V4                     | [`20230409-erc4626-linear-pool-v4`](./tasks/20230409-erc4626-linear-pool-v4)                         |
| Linear Pools for Yearn Tokens V2                       | [`20230409-yearn-linear-pool-v2`](./tasks/20230409-yearn-linear-pool-v2)                             |
| Linear Pools for Gearbox Tokens V2                     | [`20230409-gearbox-linear-pool-v2`](./tasks/20230409-gearbox-linear-pool-v2)                         |
| Linear Pools for Aave aTokens V5                       | [`20230410-aave-linear-pool-v5`](./tasks/20230410-aave-linear-pool-v5)                               |
| Linear Pools for Silo Tokens V2                        | [`20230410-silo-linear-pool-v2`](./tasks/20230410-silo-linear-pool-v2)                               |
| Managed Pool V2                                        | [`20230411-managed-pool-v2`](./tasks/20230411-managed-pool-v2)                                       |
| Authorizer with Adaptor Validation                     | [`20230414-authorizer-wrapper`](./tasks/20230414-authorizer-wrapper)                                 |
| Voting Escrow Remapper                                 | [`20230504-vebal-remapper`](./tasks/20230504-vebal-remapper)                                         |
| Gauge Registrant V4                                    | [`20230519-gauge-adder-v4`](./tasks/20230519-gauge-adder-v4)                                         |
| L2 VeBoost V2                                          | [`20230525-l2-veboost-v2`](./tasks/20230525-l2-veboost-v2)                                           |
| Polygon ZkEVM Root Gauge, for veBAL voting             | [`20230526-zkevm-root-gauge-factory`](./tasks/20230526-zkevm-root-gauge-factory)                     |
| Gauge Working Balance Helper                           | [`20230526-gauge-working-balance-helper`](./tasks/20230526-gauge-working-balance-helper)             |
| Avalanche Root Gauge, for veBAL voting                 | [`20230529-avalanche-root-gauge-factory`](./tasks/20230529-avalanche-root-gauge-factory)             |
| Timelock Authorizer, governance contract               | [`20230522-timelock-authorizer`](./tasks/20230522-timelock-authorizer)                               |
| Pool Data Queries for bulk operations                  | [`20230613-balancer-pool-data-queries`](./tasks/20230613-balancer-pool-data-queries)                 |
| Composable Stable Pools V5                             | [`20230711-composable-stable-pool-v5`](./tasks/20230711-composable-stable-pool-v5)                   |
| L2 Child Chain Gauge Checkpointer (Relayer)            | [`20230712-child-chain-gauge-checkpointer`](./tasks/20230712-child-chain-gauge-checkpointer)         |
| Chainlink Rate Provider Factory                        | [`20230717-chainlink-rate-provider-factory`](./tasks/20230717-chainlink-rate-provider-factory)       |
| Stakeless Gauge Checkpointer                           | [`20230731-stakeless-gauge-checkpointer`](./tasks/20230731-stakeless-gauge-checkpointer)             |

## Scripts

These are deployments for script-like contracts (often called 'coordinators') which are typically granted some permission by Governance and then executed, after which they become useless.

| Description                                         | Task ID                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Coordination of the veBAL deployment                | [`20220325-veBAL-deployment-coordinator`](./tasks/scripts/20220325-veBAL-deployment-coordinator)           |
| Coordination of setup of L2 gauges for veBAL system | [`20220415-veBAL-L2-gauge-setup-coordinator`](./tasks/scripts/20220415-veBAL-L2-gauge-setup-coordinator)   |
| Coordination of veBAL gauges fix (Option 1)         | [`20220418-veBAL-gauge-fix-coordinator`](./tasks/scripts/20220418-veBAL-gauge-fix-coordinator)             |
| veBAL Smart Wallet Checker Coordinator              | [`20220421-smart-wallet-checker-coordinator`](./tasks/scripts/20220421-smart-wallet-checker-coordinator)   |
| Tribe BAL Minter Coordinator                        | [`20220606-tribe-bal-minter-coordinator`](./tasks/scripts/20220606-tribe-bal-minter-coordinator)           |
| Coordination of the double entrypoint issue fix     | [`20220610-snx-recovery-coordinator`](./tasks/scripts/20220610-snx-recovery-coordinator)                   |
| Coordination of the Gauge Adder migration           | [`20220721-gauge-adder-migration-coordinator`](./tasks/scripts/20220721-gauge-adder-migration-coordinator) |
| Coordination of the Gauge Adder migration V2 --> V3 | [`20230109-gauge-adder-migration-v2-to-v3`](./tasks/scripts/20230109-gauge-adder-migration-v2-to-v3)       |
| Timelock authorizer transition permission migration | [`20230130-ta-transition-migrator`](./tasks/scripts/20230130-ta-transition-migrator)                       |
| Coordination of the Gauge Adder migration V3 --> V4 | [`20230519-gauge-adder-migration-v3-to-v4`](./tasks/scripts/20230519-gauge-adder-migration-v3-to-v4)       |

## Deprecated Deployments

These deployments have been deprecated because they're either outdated and have been replaced by newer versions, or because they no longer form part of the current infrastructure. **In almost all cases they should no longer be used,** and are only kept here for historical reasons.

Go to each deprecated deployment's readme file to learn more about why it is deprecated, and what the replacement deployment is (if any).

| Description                                         | Task ID                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Weighted Pools of up to 8 tokens                    | [`20210418-weighted-pool`](./tasks/deprecated/20210418-weighted-pool)                                   |
| Stable Pools of up to 5 tokens                      | [`20210624-stable-pool`](./tasks/deprecated/20210624-stable-pool)                                       |
| Liquidity Bootstrapping Pools of up to 4 tokens     | [`20210721-liquidity-bootstrapping-pool`](./tasks/deprecated/20210721-liquidity-bootstrapping-pool)     |
| Meta Stable Pools with 2 tokens and price oracle    | [`20210727-meta-stable-pool`](./tasks/deprecated/20210727-meta-stable-pool)                             |
| Distributor contract for LDO rewards                | [`20210811-ldo-merkle`](./tasks/deprecated/20210811-ldo-merkle)                                         |
| Relayer for Lido stETH wrapping/unwrapping          | [`20210812-lido-relayer`](./tasks/deprecated/20210812-lido-relayer)                                     |
| Basic Investment Pools for few tokens               | [`20210907-investment-pool`](./tasks/deprecated/20210907-investment-pool)                               |
| Distributor contract for arbitrum BAL rewards       | [`20210913-bal-arbitrum-merkle`](./tasks/deprecated/20210913-bal-arbitrum-merkle)                       |
| Distributor contract for arbitrum MCB rewards       | [`20210928-mcb-arbitrum-merkle`](./tasks/deprecated/20210928-mcb-arbitrum-merkle)                       |
| Merkle Orchard Distributor                          | [`20211012-merkle-orchard`](./tasks/deprecated/20211012-merkle-orchard)                                 |
| Batch Relayer                                       | [`20211203-batch-relayer`](./tasks/deprecated/20211203-batch-relayer)                                   |
| Linear Pools for Aave aTokens                       | [`20211208-aave-linear-pool`](./tasks/deprecated/20211208-aave-linear-pool)                             |
| Preminted BPT Meta Stable Pools                     | [`20211208-stable-phantom-pool`](./tasks/deprecated/20211208-stable-phantom-pool)                       |
| Linear Pools for ERC4626 Tokens                     | [`20220304-erc4626-linear-pool`](./tasks/deprecated/20220304-erc4626-linear-pool)                       |
| Batch Relayer V2                                    | [`20220318-batch-relayer-v2`](./tasks/deprecated/20220318-batch-relayer-v2)                             |
| Mainnet Staking Gauges                              | [`20220325-mainnet-gauge-factory`](./tasks/deprecated/20220325-mainnet-gauge-factory)                   |
| Single Recipient Stakeless Gauges                   | [`20220325-single-recipient-gauge-factory`](./tasks/deprecated/20220325-single-recipient-gauge-factory) |
| Gauge Registrant                                    | [`20220325-gauge-adder`](./tasks/deprecated/20220325-gauge-adder)                                       |
| Linear Pools for ERC4626 Tokens V2                  | [`20220404-erc4626-linear-pool-v2`](./tasks/deprecated/20220404-erc4626-linear-pool-v2)                 |
| Arbitrum Root Gauges, for veBAL voting              | [`20220413-arbitrum-root-gauge-factory`](./tasks/deprecated/20220413-arbitrum-root-gauge-factory)       |
| Polygon Root Gauges, for veBAL voting               | [`20220413-polygon-root-gauge-factory`](./tasks/deprecated/20220413-polygon-root-gauge-factory)         |
| Fee Distributor for veBAL holders                   | [`20220420-fee-distributor`](./tasks/deprecated/20220420-fee-distributor)                               |
| Linear Pools for Unbutton tokens                    | [`20220425-unbutton-aave-linear-pool`](./tasks/deprecated/20220425-unbutton-aave-linear-pool)           |
| Stable Pools V2 of up to 5 tokens                   | [`20220609-stable-pool-v2`](./tasks/deprecated/20220609-stable-pool-v2)                                 |
| Optimism Root Gauges, for veBAL voting              | [`20220628-optimism-root-gauge-factory`](./tasks/deprecated/20220628-optimism-root-gauge-factory)       |
| Gauge Registrant V2, supporting new networks        | [`20220628-gauge-adder-v2`](./tasks/deprecated/20220628-gauge-adder-v2)                                 |
| Batch Relayer V3                                    | [`20220720-batch-relayer-v3`](./tasks/deprecated/20220720-batch-relayer-v3)                             |
| Linear Pools for Aave aTokens (with rebalancing) V2 | [`20220817-aave-rebalanced-linear-pool`](./tasks/deprecated/20220817-aave-rebalanced-linear-pool)       |
| Composable Stable Pools                             | [`20220906-composable-stable-pool`](./tasks/deprecated/20220906-composable-stable-pool)                 |
| Weighted Pool V2                                    | [`20220908-weighted-pool-v2`](./tasks/deprecated/20220908-weighted-pool-v2)                             |
| Batch Relayer V4                                    | [`20220916-batch-relayer-v4`](./tasks/deprecated/20220916-batch-relayer-v4)                             |
| Managed Pool                                        | [`20221021-managed-pool`](./tasks/deprecated/20221021-managed-pool)                                     |
| Composable Stable Pools V2                          | [`20221122-composable-stable-pool-v2`](./tasks/deprecated/20221122-composable-stable-pool-v2)           |
| Linear Pools for Aave aTokens (with rebalancing) V3 | [`20221207-aave-rebalanced-linear-pool-v3`](./tasks/deprecated/20221207-aave-rebalanced-linear-pool-v3) |
| Gauge Registrant V3                                 | [`20230109-gauge-adder-v3`](./tasks/deprecated/20230109-gauge-adder-v3)                                 |
| Weighted Pool V3                                    | [`20230206-weighted-pool-v3`](./tasks/deprecated/20230206-weighted-pool-v3)                             |
| Composable Stable Pools V3                          | [`20230206-composable-stable-pool-v3`](./tasks/deprecated/20230206-composable-stable-pool-v3)           |
| Timelock Authorizer, governance contract            | [`20221202-timelock-authorizer`](./tasks/deprecated/20221202-timelock-authorizer)                       |
| Linear Pools for ERC4626 Tokens V3                  | [`20230206-erc4626-linear-pool-v3`](./tasks/deprecated/20230206-erc4626-linear-pool-v3)                 |
| Linear Pools for Aave aTokens (with rebalancing) V4 | [`20230206-aave-rebalanced-linear-pool-v4`](./tasks/deprecated/20230206-aave-rebalanced-linear-pool-v4) |
| Linear Pools for Yearn Tokens                       | [`20230213-yearn-linear-pool`](./tasks/deprecated/20230213-yearn-linear-pool)                           |
| Linear Pools for Gearbox Tokens                     | [`20230213-gearbox-linear-pool`](./tasks/deprecated/20230213-gearbox-linear-pool)                       |
| Linear Pools for Silo Tokens                        | [`20230315-silo-linear-pool`](./tasks/deprecated/20230315-silo-linear-pool)                             |
| Composable Stable Pools V4                          | [`20230320-composable-stable-pool-v4`](./tasks/deprecated/20230320-composable-stable-pool-v4)           |
| L2 Gauge Checkpointer                               | [`20230527-l2-gauge-checkpointer`](./tasks/deprecated/20230527-l2-gauge-checkpointer)                   |
