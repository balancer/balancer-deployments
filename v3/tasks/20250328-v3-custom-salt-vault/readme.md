# 2025-03-10 - V3 Vault Factory with a custom salt

This is meant to be a one-off task to support Vault deployment on Avalanche. Since the VaultFactory must be deployed from a specific account, any mistake would result in a different Vault address. To keep the same Vault address, we must mine a new salt to work with another nonce, and pass it in.

## Useful Files

- [Code](https://github.com/balancer/balancer-v3-monorepo/commit/e1ae7f091244ae20e5c1add3e7f89b6d33f48d23).
- [`VaultFactory` artifact](./artifact/VaultFactory.json)

