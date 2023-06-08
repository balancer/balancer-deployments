# 2023-05-25 - VeBoost V2

Deployment of the VeBoostV2 in L2 networks.
This contract shall be used as the delegation for the `VotingEscrowDelegationProxy`, using LayerZero's `OmniVotingEscrowChild` as Voting Escrow.

This allows using and delegating bridged veBAL balances in L2 networks.
The artifact is the same as in the [20221205-veboost-v2 task](../20221205-veboost-v2/); constructor arguments and fork tests differ.

## Useful Files

- [Polygon mainnet addresses](./output/polygon.json)
- [Arbitrum mainnet addresses](./output/arbitrum.json)
- [Optimism mainnet addresses](./output/optimism.json)
- [Gnosis mainnet addresses](./output/gnosis.json)
- [Avalanche mainnet addresses](./output/avalanche.json)
- [Polygon zkEVM mainnet addresses](./output/zkevm.json)
- [`VeBoostV2` artifact](./artifact/VeBoostV2.json)
