# 2025-03-21 - V3 VaultFactory V2

Redeployment of the VaultFactory for V3.
The current VaultFactory deploys the ProtocolFeeController and passes it into the Vault. This introduces an unwanted coupling, since with this design we would need to redeploy the VaultFactory every time we migrated to a new version of the fee controller. This version removes the deployment and accepts the fee controller address in the `create` function, passing it through to the Vault. (This will also decrease the size of the VaultFactory contract and reduce the gas requirement deploy the Vault through the factory.)

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/e1ae7f091244ae20e5c1add3e7f89b6d33f48d23).
- [`VaultFactory` artifact](./artifact/VaultFactory.json)

