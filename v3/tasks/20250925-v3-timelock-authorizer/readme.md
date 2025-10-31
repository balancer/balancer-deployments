# 2025-08-29 - V3 Timelock Authorizer

Deployment of the `TimelockAuthorizer` in order to replace the basic Authorizer deployed with the Vault.
This Authorizer implementation allows defining a delay per action identifier. Users can only execute functions directly when there is no delay. Otherwise, they're granted permission to schedule an action, which can then be executed by the Authorizer after the delay. It also introduces Granters and Revokers, to allow controlled delegation of permission handling to third parties, which eases the burden on governance and allows the system to scale. For instance, a smaller multisig might be designated as a Granter for certain veBAL-related functions for new pools.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/c31e1f05c6c9092c07efa6149abebe4e7bf834ff).
- [`TimelockAuthorizer` artifact](./artifact/TimelockAuthorizer.json)
- [`TimelockAuthorizerMigrator` artifact](./artifact/TimelockAuthorizerMigrator.json)
- [`TimelockExecutionHelper` artifact](./artifact/TimelockExecutionHelper.json)
