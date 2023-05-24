import fs from 'fs';
import path from 'path';
import Task, { TaskStatus } from './task';

import { Network } from './types';

const DEPLOYMENT_TXS_DIRECTORY = path.resolve(__dirname, '../deployment-txs');
const CONTRACT_ADDRESSES_DIRECTORY = path.resolve(__dirname, '../addresses');

export function saveContractDeploymentTransactionHash(
  deployedAddress: string,
  deploymentTransactionHash: string,
  network: Network
): void {
  if (network === 'hardhat') return;

  const filePath = path.join(DEPLOYMENT_TXS_DIRECTORY, `${network}.json`);
  const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

  // Load the existing content if any exists.
  const newFileContents: Record<string, string> = fileExists ? JSON.parse(fs.readFileSync(filePath).toString()) : {};

  // Write the new entry.
  newFileContents[deployedAddress] = deploymentTransactionHash;

  fs.writeFileSync(filePath, JSON.stringify(newFileContents, null, 2));
}

export function getContractDeploymentTransactionHash(deployedAddress: string, network: Network): string {
  const filePath = path.join(DEPLOYMENT_TXS_DIRECTORY, `${network}.json`);
  const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  if (!fileExists) {
    throw Error(`Could not find file for deployment transaction hashes for network '${network}'`);
  }

  const deploymentTxs: Record<string, string> = JSON.parse(fs.readFileSync(filePath).toString());
  const txHash = deploymentTxs[deployedAddress];
  if (txHash === undefined) {
    throw Error(`No transaction hash for contract ${deployedAddress} on network '${network}'`);
  }

  return txHash;
}

/**
 * Saves a file with the canonical deployment addresses for all tasks in a given network.
 */
export function saveContractDeploymentAddresses(tasks: Task[], network: string): void {
  if (network === 'hardhat') return;

  const allTaskEntries = buildContractDeploymentAddressesEntries(tasks);
  const filePath = path.join(CONTRACT_ADDRESSES_DIRECTORY, `${network}.json`);

  fs.writeFileSync(filePath, _stringifyEntries(allTaskEntries));
}

/**
 * Builds an object that maps task IDs to deployment info for all given tasks.
 * The resulting format reads as follows:
 * <task-id>: {
 *   contracts: [
 *     {
 *       name: <contract-name>,
 *       address: <deployment-address>
 *     },
 *     (...)
 *   ],
 *   status: <ACTIVE | DEPRECATED | SCRIPT>
 * },
 * (...)
 */
export function buildContractDeploymentAddressesEntries(tasks: Task[]): object {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allTaskEntries = {} as any;

  for (const task of tasks) {
    const taskEntries = Object.entries(task.output({ ensure: false }))
      .map(([name, address]) => [{ name, address }])
      .flat();

    // Some tasks do not have outputs for every network, so we just skip them.
    if (taskEntries.length == 0) {
      continue;
    }

    allTaskEntries = {
      ...allTaskEntries,
      [task.id]: {
        contracts: [...taskEntries],
        status: TaskStatus[task.getStatus()],
      },
    };
  }

  return allTaskEntries;
}

/**
 * Returns true if the existing deployment addresses file stored in `CONTRACT_ADDRESSES_DIRECTORY` matches the
 * canonical one for the given network; false otherwise.
 */
export function checkContractDeploymentAddresses(tasks: Task[], network: string): boolean {
  const allTaskEntries = buildContractDeploymentAddressesEntries(tasks);

  const filePath = path.join(CONTRACT_ADDRESSES_DIRECTORY, `${network}.json`);
  const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

  // Load the existing content if any exists.
  const existingFileContents: string = fileExists ? fs.readFileSync(filePath).toString() : '';

  return _stringifyEntries(allTaskEntries) === existingFileContents;
}

function _stringifyEntries(entries: object): string {
  return JSON.stringify(entries, null, 2);
}
