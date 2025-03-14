# 2025-03-10 - V3 VaultFactory V2

Redeployment of the VaultFactory for V3.
The current VaultFactory deploys the ProtocolFeeController and passes it into the Vault. This introduces an unwanted coupling, since with this design we would need to redeploy the VaultFactory every time we migrated to a new version of the fee controller. This version removes the deployment and accepts the fee controller address in the `create` function, passing it through to the Vault. (This will also decrease the size of the VaultFactory contract.)

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/77290600e9c896707c26d2a353ecfe82d97fa5b9).
- [`VaultFactory` artifact](./artifact/VaultFactory.json)

