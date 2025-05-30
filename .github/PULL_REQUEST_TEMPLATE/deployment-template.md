# Deployment: <!-- Deployment title: contract or feature (e.g. `ManagedPool`) -->

## Deployment tasks checklist:

- [ ] Contract(s) deployed to all target networks / testnets
- [ ] TX IDs are properly generated
- [ ] Action IDs are generated after deployment (if applicable) <!-- This includes contracts deployed by contracts (e.g. mock pools deployed by factories) -->
- [ ] If a governance proposal is required, Action IDs have been sent to the Maxis
- [ ] Outputs for all target networks are generated, and linked in the task `readme`
- [ ] Addresses files are up to date with the new deployment <!-- yarn build-address-lookup -->
- [ ] Contracts are verified in every network <!-- This includes contracts deployed by contracts (e.g. mock pools deployed by factories) -->
- [ ] Deployments `CHANGELOG` is updated
- [ ] There are no code changes of any kind

## Issue Resolution

<!-- If this PR addresses an issue, note that here: e.g., Closes/Fixes/Resolves #1346. -->
