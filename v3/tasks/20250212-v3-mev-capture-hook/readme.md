# 2025-02-12 - MEV Capture Hook

MEV Capture Hook deployment. This hook increases the dynamic swap fee of pools using it when priority gas fees spike beyond a configurable threshold.
This contract is targeted for Base and L2 networks in general, where the priority gas fee determines the relative order of the transactions within a block.

## Useful Files

- Code [link](https://github.com/balancer/balancer-v3-monorepo/commit/0c38dc629386c401e3d6094981d7990f2fe0a379).
- [`MevCaptureHook` artifact](./artifact/MevCaptureHook.json)
