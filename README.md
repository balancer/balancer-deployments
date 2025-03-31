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

| Description                                            | Task ID                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Authorizer, governance contract                        | [`20210418-authorizer`](./v2/tasks/20210418-authorizer)                                                 |
| Vault, main protocol contract                          | [`20210418-vault`](./v2/tasks/20210418-vault)                                                           |
| Rate Provider for wstETH                               | [`20210812-wsteth-rate-provider`](./v2/tasks/20210812-wsteth-rate-provider)                             |
| Liquidity Bootstrapping Pools                          | [`20211202-no-protocol-fee-lbp`](./v2/tasks/20211202-no-protocol-fee-lbp)                               |
| Authorizer Adaptor for extending governance            | [`20220325-authorizer-adaptor`](./v2/tasks/20220325-authorizer-adaptor)                                 |
| Wallet for the BAL token                               | [`20220325-bal-token-holder-factory`](./v2/tasks/20220325-bal-token-holder-factory)                     |
| Admin of the BAL token                                 | [`20220325-balancer-token-admin`](./v2/tasks/20220325-balancer-token-admin)                             |
| Liquidity Mining: veBAL, Gauge Controller and Minter   | [`20220325-gauge-controller`](./v2/tasks/20220325-gauge-controller)                                     |
| Test Balancer Token                                    | [`20220325-test-balancer-token`](./v2/tasks/20220325-test-balancer-token)                               |
| Delegation of veBAL boosts                             | [`20220325-ve-delegation`](./v2/tasks/20220325-ve-delegation)                                           |
| veBAL Smart Wallet Checker                             | [`20220420-smart-wallet-checker`](./v2/tasks/20220420-smart-wallet-checker)                             |
| Relayer with the fix for the Double Entrypoint issue   | [`20220513-double-entrypoint-fix-relayer`](./v2/tasks/20220513-double-entrypoint-fix-relayer)           |
| Protocol Fee Withdrawer                                | [`20220517-protocol-fee-withdrawer`](./v2/tasks/20220517-protocol-fee-withdrawer)                       |
| Preseeded Voting Escrow Delegation                     | [`20220530-preseeded-voting-escrow-delegation`](./v2/tasks/20220530-preseeded-voting-escrow-delegation) |
| Distribution Scheduler for reward tokens on gauges     | [`20220707-distribution-scheduler`](./v2/tasks/20220707-distribution-scheduler)                         |
| Fee Distributor for veBAL holders V2                   | [`20220714-fee-distributor-v2`](./v2/tasks/20220714-fee-distributor-v2)                                 |
| Swap, join and exit simulations (queries)              | [`20220721-balancer-queries`](./v2/tasks/20220721-balancer-queries)                                     |
| Protocol fee percentages provider                      | [`20220725-protocol-fee-percentages-provider`](./v2/tasks/20220725-protocol-fee-percentages-provider)   |
| Mainnet Staking Gauges V2                              | [`20220822-mainnet-gauge-factory-v2`](./v2/tasks/20220822-mainnet-gauge-factory-v2)                     |
| Arbitrum Root Gauges V2, for veBAL voting              | [`20220823-arbitrum-root-gauge-factory-v2`](./v2/tasks/20220823-arbitrum-root-gauge-factory-v2)         |
| Optimism Root Gauges V2, for veBAL voting              | [`20220823-optimism-root-gauge-factory-v2`](./v2/tasks/20220823-optimism-root-gauge-factory-v2)         |
| Polygon Root Gauges V2, for veBAL voting               | [`20220823-polygon-root-gauge-factory-v2`](./v2/tasks/20220823-polygon-root-gauge-factory-v2)           |
| Pool Recovery Helper                                   | [`20221123-pool-recovery-helper`](./v2/tasks/20221123-pool-recovery-helper)                             |
| Authorizer Adaptor Entrypoint                          | [`20221124-authorizer-adaptor-entrypoint`](./v2/tasks/20221124-authorizer-adaptor-entrypoint)           |
| VeBoost V2                                             | [`20221205-veboost-v2`](./v2/tasks/20221205-veboost-v2)                                                 |
| Single Recipient Stakeless Gauges V2                   | [`20230215-single-recipient-gauge-factory`](./v2/tasks/20230215-single-recipient-gauge-factory-v2)      |
| Gnosis Root Gauge, for veBAL voting                    | [`20230217-gnosis-root-gauge-factory`](./v2/tasks/20230217-gnosis-root-gauge-factory)                   |
| Merkle Orchard Distributor V2                          | [`20230222-merkle-orchard-v2`](./v2/tasks/20230222-merkle-orchard-v2)                                   |
| Protocol ID registry                                   | [`20230223-protocol-id-registry`](./v2/tasks/20230223-protocol-id-registry)                             |
| L2 Balancer Pseudo Minter                              | [`20230316-l2-balancer-pseudo-minter`](./v2/tasks/20230316-l2-balancer-pseudo-minter)                   |
| Child Chain Gauge Factory V2                           | [`20230316-child-chain-gauge-factory-v2`](./v2/tasks/20230316-child-chain-gauge-factory-v2)             |
| L2 Voting Escrow Delegation Proxy                      | [`20230316-l2-ve-delegation-proxy`](./v2/tasks/20230316-l2-ve-delegation-proxy)                         |
| Weighted Pool V4                                       | [`20230320-weighted-pool-v4`](./v2/tasks/20230320-weighted-pool-v4)                                     |
| L2 Layer0 Bridge Forwarder                             | [`20230404-l2-layer0-bridge-forwarder`](./v2/tasks/20230404-l2-layer0-bridge-forwarder)                 |
| Managed Pool V2                                        | [`20230411-managed-pool-v2`](./v2/tasks/20230411-managed-pool-v2)                                       |
| Authorizer with Adaptor Validation                     | [`20230414-authorizer-wrapper`](./v2/tasks/20230414-authorizer-wrapper)                                 |
| Voting Escrow Remapper                                 | [`20230504-vebal-remapper`](./v2/tasks/20230504-vebal-remapper)                                         |
| Gauge Registrant V4                                    | [`20230519-gauge-adder-v4`](./v2/tasks/20230519-gauge-adder-v4)                                         |
| LayerZero OmniVotingEscrowChild (Base)                 | [`20230524-base-lz-omni-voting-escrow-child`](./v2/tasks/20230524-base-lz-omni-voting-escrow-child)     |
| LayerZero OmniVotingEscrow                             | [`20230524-mainnet-lz-omni-voting-escrow`](./v2/tasks/20230524-mainnet-lz-omni-voting-escrow)           |
| LayerZero OmniVotingEscrowChild                        | [`20230524-lz-omni-voting-escrow-child`](./v2/tasks/20230524-lz-omni-voting-escrow-child)               |
| L2 VeBoost V2                                          | [`20230525-l2-veboost-v2`](./v2/tasks/20230525-l2-veboost-v2)                                           |
| Polygon ZkEVM Root Gauge, for veBAL voting             | [`20230526-zkevm-root-gauge-factory`](./v2/tasks/20230526-zkevm-root-gauge-factory)                     |
| Gauge Working Balance Helper                           | [`20230526-gauge-working-balance-helper`](./v2/tasks/20230526-gauge-working-balance-helper)             |
| Timelock Authorizer, governance contract               | [`20230522-timelock-authorizer`](./v2/tasks/20230522-timelock-authorizer)                               |
| Pool Data Queries for bulk operations                  | [`20230613-balancer-pool-data-queries`](./v2/tasks/20230613-balancer-pool-data-queries)                 |
| L2 Child Chain Gauge Checkpointer (Relayer)            | [`20230712-child-chain-gauge-checkpointer`](./v2/tasks/20230712-child-chain-gauge-checkpointer)         |
| Chainlink Rate Provider Factory                        | [`20230717-chainlink-rate-provider-factory`](./v2/tasks/20230717-chainlink-rate-provider-factory)       |
| Avalanche Root Gauge V2, for veBAL voting              | [`20230811-avalanche-root-gauge-factory-v2`](./v2/tasks/20230811-avalanche-root-gauge-factory-v2)       |
| Base Root Gauge, for veBAL voting                      | [`20230911-base-root-gauge-factory`](./v2/tasks/20230911-base-root-gauge-factory)                       |
| Stakeless Gauge Checkpointer V2                        | [`20230915-stakeless-gauge-checkpointer-v2`](./v2/tasks/20230915-stakeless-gauge-checkpointer-v2)       |
| Batch Relayer V6                                       | [`20231031-batch-relayer-v6`](./v2/tasks/20231031-batch-relayer-v6)                                     |
| Composable Stable Pools V6                             | [`20240223-composable-stable-pool-v6`](./v2/tasks/20240223-composable-stable-pool-v6)                   |
| Fraxtal Root Gauge, for veBAL voting                   | [`20240522-fraxtal-root-gauge-factory`](./v2/tasks/20240522-fraxtal-root-gauge-factory)                 |
| V3 Vault                                               | [`20241204-v3-vault`](./v3/tasks/20241204-v3-vault)                                                     |
| V3 Weighted Pool                                       | [`20241205-v3-weighted-pool`](./v3/tasks/20241205-v3-weighted-pool)                                     |
| V3 Batch Router                                        | [`20241205-v3-batch-router`](./v3/tasks/20241205-v3-batch-router)                                       |
| V3 Buffer Router                                       | [`20241205-v3-buffer-router`](./v3/tasks/20241205-v3-buffer-router)                                     |
| V3 Vault Explorer                                      | [`20241205-v3-vault-explorer`](./v3/tasks/20241205-v3-vault-explorer)                                   |
| V3 Hook Examples                                       | [`20241213-v3-hook-examples`](./v3/tasks/20241213-v3-hook-examples)                                     |
| V3 Balancer Contract Registry                          | [`20250117-v3-contract-registry`](./v3/tasks/20250117-v3-contract-registry)                             |
| V3 Gyro 2-CLP                                          | [`20250120-v3-gyro-2clp`](./v3/tasks/20250120-v3-gyro-2clp)                                             |
| V3 Stable Surge Pool                                   | [`20250121-v3-stable-surge`](./v3/tasks/20250121-v3-stable-surge)                                       |
| V3 Composite Liquidity Router (2)                      | [`20250123-v3-composite-liquidity-router-v2`](./v3/tasks/20250123-v3-composite-liquidity-router-v2)     |
| V3 Gyro E-CLP                                          | [`20250124-v3-gyro-eclp`](./v3/tasks/20250124-v3-gyro-eclp)                                             |
| V3 MEV Capture Hook                                    | [`20250212-v3-mev-capture-hook`](./v3/tasks/20250212-v3-mev-capture-hook)                               |
| V3 Protocol Fee Controller V2                          | [`20250214-v3-protocol-fee-controller-v2`](./v3/tasks/20250214-v3-protocol-fee-controller-v2)           |
| V3 Aggregator Router                                   | [`20250218-v3-aggregator-router`](./v3/tasks/20250218-v3-aggregator-router)                             |
| V3 Cow Swap Fee Burner                                 | [`20250221-v3-cow-swap-fee-burner`](./v3/tasks/20250221-v3-cow-swap-fee-burner)                         |
| V3 Protocol Fee Sweeper                                | [`20250228-v3-protocol-fee-sweeper`](./v3/tasks/20250228-v3-protocol-fee-sweeper)                       |
| V3 Router V2                                           | [`20250307-v3-router-v2`](./v3/tasks/20250307-v3-router-v2)                                             |
| V3 Liquidity Bootstrapping Pool                        | [`20250307-v3-liquidity-bootstrapping-pool`](./v3/tasks/20250307-v3-liquidity-bootstrapping-pool)       |
| V3 Vault Factory V2, and Vault contracts               | [`20250321-v3-vault-factory-v2`](./v3/tasks/20250321-v3-vault-factory-v2)                               |
| V3 Stable Pool V2                                      | [`20250324-v3-stable-pool-v2`](./v3/tasks/20250324-v3-stable-pool-v2)                                   |
| V3 Vault Factory with custom salt (for Avalanche)      | [`20250328-v3-custom-salt-vault`](./v3/tasks/20250328-v3-custom-salt-vault)                             |

## Scripts

These are deployments for script-like contracts (often called 'coordinators') which are typically granted some permission by Governance and then executed, after which they become useless.

| Description                                         | Task ID                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Coordination of the veBAL deployment                | [`20220325-veBAL-deployment-coordinator`](./v2/scripts/20220325-veBAL-deployment-coordinator)           |
| Coordination of setup of L2 gauges for veBAL system | [`20220415-veBAL-L2-gauge-setup-coordinator`](./v2/scripts/20220415-veBAL-L2-gauge-setup-coordinator)   |
| Coordination of veBAL gauges fix (Option 1)         | [`20220418-veBAL-gauge-fix-coordinator`](./v2/scripts/20220418-veBAL-gauge-fix-coordinator)             |
| veBAL Smart Wallet Checker Coordinator              | [`20220421-smart-wallet-checker-coordinator`](./v2/scripts/20220421-smart-wallet-checker-coordinator)   |
| Tribe BAL Minter Coordinator                        | [`20220606-tribe-bal-minter-coordinator`](./v2/scripts/20220606-tribe-bal-minter-coordinator)           |
| Coordination of the double entrypoint issue fix     | [`20220610-snx-recovery-coordinator`](./v2/scripts/20220610-snx-recovery-coordinator)                   |
| Coordination of the Gauge Adder migration           | [`20220721-gauge-adder-migration-coordinator`](./v2/scripts/20220721-gauge-adder-migration-coordinator) |
| Coordination of the Gauge Adder migration V2 --> V3 | [`20230109-gauge-adder-migration-v2-to-v3`](./v2/scripts/20230109-gauge-adder-migration-v2-to-v3)       |
| Timelock authorizer transition permission migration | [`20230130-ta-transition-migrator`](./v2/scripts/20230130-ta-transition-migrator)                       |
| Coordination of the Gauge Adder migration V3 --> V4 | [`20230519-gauge-adder-migration-v3-to-v4`](./v2/scripts/20230519-gauge-adder-migration-v3-to-v4)       |
| Protocol Fee Controller Migration                   | [`20250221-protocol-fee-controller-migration`](./v3/scripts/20250221-protocol-fee-controller-migration) |
| Balancer Contract Registry Initializer              | [`20250314-balancer-registry-initializer`](./v3/scripts/20250314-balancer-registry-initializer)         |

## Deprecated Deployments

These deployments have been deprecated because they're either outdated and have been replaced by newer versions, or because they no longer form part of the current infrastructure. **In almost all cases they should no longer be used,** and are only kept here for historical reasons.

Go to each deprecated deployment's readme file to learn more about why it is deprecated, and what the replacement deployment is (if any).

| Description                                         | Task ID                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------     |
| Weighted Pools of up to 8 tokens                    | [`20210418-weighted-pool`](./v2/deprecated/20210418-weighted-pool)                                       |
| Stable Pools of up to 5 tokens                      | [`20210624-stable-pool`](./v2/deprecated/20210624-stable-pool)                                           |
| Liquidity Bootstrapping Pools of up to 4 tokens     | [`20210721-liquidity-bootstrapping-pool`](./v2/deprecated/20210721-liquidity-bootstrapping-pool)         |
| Meta Stable Pools with 2 tokens and price oracle    | [`20210727-meta-stable-pool`](./v2/deprecated/20210727-meta-stable-pool)                                 |
| Distributor contract for LDO rewards                | [`20210811-ldo-merkle`](./v2/deprecated/20210811-ldo-merkle)                                             |
| Relayer for Lido stETH wrapping/unwrapping          | [`20210812-lido-relayer`](./v2/deprecated/20210812-lido-relayer)                                         |
| Basic Investment Pools for few tokens               | [`20210907-investment-pool`](./v2/deprecated/20210907-investment-pool)                                   |
| Distributor contract for arbitrum BAL rewards       | [`20210913-bal-arbitrum-merkle`](./v2/deprecated/20210913-bal-arbitrum-merkle)                           |
| Distributor contract for arbitrum MCB rewards       | [`20210928-mcb-arbitrum-merkle`](./v2/deprecated/20210928-mcb-arbitrum-merkle)                           |
| Merkle Orchard Distributor                          | [`20211012-merkle-orchard`](./v2/deprecated/20211012-merkle-orchard)                                     |
| Batch Relayer                                       | [`20211203-batch-relayer`](./v2/deprecated/20211203-batch-relayer)                                       |
| Linear Pools for Aave aTokens                       | [`20211208-aave-linear-pool`](./v2/deprecated/20211208-aave-linear-pool)                                 |
| Preminted BPT Meta Stable Pools                     | [`20211208-stable-phantom-pool`](./v2/deprecated/20211208-stable-phantom-pool)                           |
| Linear Pools for ERC4626 Tokens                     | [`20220304-erc4626-linear-pool`](./v2/deprecated/20220304-erc4626-linear-pool)                           |
| Batch Relayer V2                                    | [`20220318-batch-relayer-v2`](./v2/deprecated/20220318-batch-relayer-v2)                                 |
| Mainnet Staking Gauges                              | [`20220325-mainnet-gauge-factory`](./v2/deprecated/20220325-mainnet-gauge-factory)                       |
| Single Recipient Stakeless Gauges                   | [`20220325-single-recipient-gauge-factory`](./v2/deprecated/20220325-single-recipient-gauge-factory)     |
| Gauge Registrant                                    | [`20220325-gauge-adder`](./v2/deprecated/20220325-gauge-adder)                                           |
| Linear Pools for ERC4626 Tokens V2                  | [`20220404-erc4626-linear-pool-v2`](./v2/deprecated/20220404-erc4626-linear-pool-v2)                     |
| Gauges on child networks (L2s and sidechains)       | [`20220413-child-chain-gauge-factory`](./v2/deprecated/20220413-child-chain-gauge-factory)               |
| Arbitrum Root Gauges, for veBAL voting              | [`20220413-arbitrum-root-gauge-factory`](./v2/deprecated/20220413-arbitrum-root-gauge-factory)           |
| Polygon Root Gauges, for veBAL voting               | [`20220413-polygon-root-gauge-factory`](./v2/deprecated/20220413-polygon-root-gauge-factory)             |
| Fee Distributor for veBAL holders                   | [`20220420-fee-distributor`](./v2/deprecated/20220420-fee-distributor)                                   |
| Linear Pools for Unbutton tokens                    | [`20220425-unbutton-aave-linear-pool`](./v2/deprecated/20220425-unbutton-aave-linear-pool)               |
| Child Chain Gauge Token Adder                       | [`20220527-child-chain-gauge-token-adder`](./v2/deprecated/20220527-child-chain-gauge-token-adder)       |
| Child Chain Gauge Reward Helper                     | [`20220812-child-chain-reward-helper`](./v2/deprecated/20220812-child-chain-reward-helper)               |
| Stable Pools V2 of up to 5 tokens                   | [`20220609-stable-pool-v2`](./v2/deprecated/20220609-stable-pool-v2)                                     |
| Optimism Root Gauges, for veBAL voting              | [`20220628-optimism-root-gauge-factory`](./v2/deprecated/20220628-optimism-root-gauge-factory)           |
| Gauge Registrant V2, supporting new networks        | [`20220628-gauge-adder-v2`](./v2/deprecated/20220628-gauge-adder-v2)                                     |
| Batch Relayer V3                                    | [`20220720-batch-relayer-v3`](./v2/deprecated/20220720-batch-relayer-v3)                                 |
| Linear Pools for Aave aTokens (with rebalancing) V2 | [`20220817-aave-rebalanced-linear-pool`](./v2/deprecated/20220817-aave-rebalanced-linear-pool)           |
| Composable Stable Pools                             | [`20220906-composable-stable-pool`](./v2/deprecated/20220906-composable-stable-pool)                     |
| Weighted Pool V2                                    | [`20220908-weighted-pool-v2`](./v2/deprecated/20220908-weighted-pool-v2)                                 |
| Batch Relayer V4                                    | [`20220916-batch-relayer-v4`](./v2/deprecated/20220916-batch-relayer-v4)                                 |
| Managed Pool                                        | [`20221021-managed-pool`](./v2/deprecated/20221021-managed-pool)                                         |
| Composable Stable Pools V2                          | [`20221122-composable-stable-pool-v2`](./v2/deprecated/20221122-composable-stable-pool-v2)               |
| Linear Pools for Aave aTokens (with rebalancing) V3 | [`20221207-aave-rebalanced-linear-pool-v3`](./v2/deprecated/20221207-aave-rebalanced-linear-pool-v3)     |
| Gauge Registrant V3                                 | [`20230109-gauge-adder-v3`](./v2/deprecated/20230109-gauge-adder-v3)                                     |
| Weighted Pool V3                                    | [`20230206-weighted-pool-v3`](./v2/deprecated/20230206-weighted-pool-v3)                                 |
| Composable Stable Pools V3                          | [`20230206-composable-stable-pool-v3`](./v2/deprecated/20230206-composable-stable-pool-v3)               |
| Linear Pools for Euler Tokens                       | [`20230208-euler-linear-pool`](./v2/deprecated/20230208-euler-linear-pool)                               |
| Timelock Authorizer, governance contract            | [`20221202-timelock-authorizer`](./v2/deprecated/20221202-timelock-authorizer)                           |
| Linear Pools for ERC4626 Tokens V3                  | [`20230206-erc4626-linear-pool-v3`](./v2/deprecated/20230206-erc4626-linear-pool-v3)                     |
| Linear Pools for Aave aTokens (with rebalancing) V4 | [`20230206-aave-rebalanced-linear-pool-v4`](./v2/deprecated/20230206-aave-rebalanced-linear-pool-v4)     |
| Linear Pools for Yearn Tokens                       | [`20230213-yearn-linear-pool`](./v2/deprecated/20230213-yearn-linear-pool)                               |
| Linear Pools for Gearbox Tokens                     | [`20230213-gearbox-linear-pool`](./v2/deprecated/20230213-gearbox-linear-pool)                           |
| Batch Relayer V5                                    | [`20230314-batch-relayer-v5`](./v2/deprecated/20230314-batch-relayer-v5)                                 |
| Linear Pools for Silo Tokens                        | [`20230315-silo-linear-pool`](./v2/deprecated/20230315-silo-linear-pool)                                 |
| Composable Stable Pools V4                          | [`20230320-composable-stable-pool-v4`](./v2/deprecated/20230320-composable-stable-pool-v4)               |
| Linear Pools for ERC4626 Tokens V4                  | [`20230409-erc4626-linear-pool-v4`](./v2/deprecated/20230409-erc4626-linear-pool-v4)                     |
| Linear Pools for Yearn Tokens V2                    | [`20230409-yearn-linear-pool-v2`](./v2/deprecated/20230409-yearn-linear-pool-v2)                         |
| Linear Pools for Gearbox Tokens V2                  | [`20230409-gearbox-linear-pool-v2`](./v2/deprecated/20230409-gearbox-linear-pool-v2)                     |
| Linear Pools for Aave aTokens V5                    | [`20230410-aave-linear-pool-v5`](./v2/deprecated/20230410-aave-linear-pool-v5)                           |
| Linear Pools for Silo Tokens V2                     | [`20230410-silo-linear-pool-v2`](./v2/deprecated/20230410-silo-linear-pool-v2)                           |
| L2 Gauge Checkpointer                               | [`20230527-l2-gauge-checkpointer`](./v2/deprecated/20230527-l2-gauge-checkpointer)                       |
| Avalanche Root Gauge, for veBAL voting              | [`20230529-avalanche-root-gauge-factory`](./v2/deprecated/20230529-avalanche-root-gauge-factory)         |
| Composable Stable Pools V5                          | [`20230711-composable-stable-pool-v5`](./v2/deprecated/20230711-composable-stable-pool-v5)               |
| Composable Stable Pools V5 (ZKEVM)                  | [`20230711-zkevm-composable-stable-pool-v5`](./v2/deprecated/20230711-zkevm-composable-stable-pool-v5)   |
| Stakeless Gauge Checkpointer                        | [`20230731-stakeless-gauge-checkpointer`](./v2/deprecated/20230731-stakeless-gauge-checkpointer)         |
| V3 Composite Liquidity Router                       | [`20241205-v3-composite-liquidity-router`](./v3/deprecated/20241205-v3-composite-liquidity-router)       |
| V3 Router                                           | [`20241205-v3-router`](./v3/deprecated/20241205-v3-router)                                               |
| V3 Stable Pool                                      | [`20241205-v3-stable-pool`](./v3/deprecated/20241205-v3-stable-pool)                                     |
