/// This file represents configuration settings used by the contract after its deployment.
/// The original deployment input settings must be kept intact to be able to verify the deployments.
const settings = {
  goerli: require('./settings/goerli.ts'),
  sepolia: require('./settings/sepolia.ts'),
};

export default settings;
