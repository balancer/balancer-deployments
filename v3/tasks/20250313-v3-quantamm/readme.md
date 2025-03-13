# 2025-03-13 - QuantAMM

Deployment of the `QuantAMM` infrastructure for Balancer V3.

The update weight runner orchestrates calling registered rules for pools. These rules determine weight vectors for target pools using chainlink oracles. The update weight runner then sets these weights on the pools. 

The QuantAMMWeightedPoolFactory is a factory for those pools and uses the V2 split factory method. 

## Useful Files

- [Code](https://github.com/QuantAMMProtocol/QuantAMM-V1/commit/5c91f5ff35b03f76495afb12d38de64f4d37f5b1).
- [`AntiMomentumUpdateRule` artifact](./artifact/AntiMomentumUpdateRule.json)
- [`ChannelFollowingUpdateRule` artifact](./artifact/ChannelFollowingUpdateRule.json)
- [`PowerChannelUpdateRule` artifact](./artifact/PowerChannelUpdateRule.json)
- [`DifferenceMomentumUpdateRule` artifact](./artifact/DifferenceMomentumUpdateRule.json)
- [`MinimumVarianceUpdateRule` artifact](./artifact/MinimumVarianceUpdateRule.json)
- [`ChainlinkOracle` artifact](./artifact/ChainlinkOracle.json) 
- [`UpdateWeightRunner` artifact](./artifact/UpdateWeightRunner.json)
- [`QuantAMMWeightedPoolFactory` artifact](./artifact/QuantAMMWeightedPoolFactory.json)
