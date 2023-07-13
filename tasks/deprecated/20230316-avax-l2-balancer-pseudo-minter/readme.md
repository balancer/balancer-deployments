# 2023-03-16 - L2 Balancer Pseudo Minter

> ⚠️ **DEPRECATED: do not use** ⚠️
> This deployment has been deprecated in Avalanche because the BAL token address changed, and this contract requires it to work.
> See previous BAL address [here](../00000000-avax-tokens/output/avalanche.json) and current address [here](../../00000000-tokens/output/avalanche.json).
> The contract has been redeployed with the same build-info and the new configuration in the [original task](../../20230316-l2-balancer-pseudo-minter/).

Deployment of the `L2BalancerPseudoMinter`, which distributes bridged BAL tokens on networks other than Mainnet and keeps track of the rewards that have already been distributed for each user.
It is analogous to the `BalancerMinter` deployed to Mainnet as part of the [Gauge Controller deployment](../../20220325-gauge-controller/output/mainnet.json), providing a similar user interface.
The main difference between the two is that the pseudo minter does not actually mint tokens; it just distributes bridged tokens instead.

## Useful Files

- [Avalanche mainnet addresses](./output/avalanche.json)
- [`L2BalancerPseudoMinter` artifact](./artifact/L2BalancerPseudoMinter.json)
