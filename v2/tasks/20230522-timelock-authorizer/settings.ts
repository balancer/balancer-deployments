import input from './input';

// This file represents configuration settings used by the contract after its deployment.
// The original deployment input settings must be kept intact to be able to verify the deployments.

const networks = input.networks;

// Assign settings file for each deployed network.
const settings = Object.fromEntries(
  networks.map((network: string) => {
    return [network, require(`./settings/${network}.ts`)];
  })
);

export default settings;
