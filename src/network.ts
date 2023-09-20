import fs from 'fs';
import path from 'path';
import Task, { TaskStatus } from './task';

import { Network } from './types';
import { getActionIdInfo } from 'actionId';
import { timestampToString } from '@helpers/time';

const DEPLOYMENT_TXS_DIRECTORY = path.resolve(__dirname, '../deployment-txs');
const CONTRACT_ADDRESSES_DIRECTORY = path.resolve(__dirname, '../addresses');
const TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY = path.resolve(__dirname, '../timelock-authorizer-config');

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

/**
 * Builds and saves the timelock authorizer config JSON file, containing grant and execution delays.
 * It is based in the input configuration in the deployment task for the given network.
 */
export async function saveTimelockAuthorizerConfig(task: Task, network: string) {
  const allDelays = _buildTimelockAuthorizerConfig(task, network);
  if (Object.keys(allDelays).length > 0) {
    const filePath = path.join(TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY, `${network}.json`);
    fs.writeFileSync(filePath, _stringifyEntries(allDelays));
  }
}

/**
 * Returns true if the config file in `TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY` has the right configuration for the
 * network, and false otherwise.
 * If the timelock authorizer is not deployed for a given network, the file should not exist.
 * If the timelock authorizer is deployed for a given network, the file should exist and not be empty.
 */
export function checkTimelockAuthorizerConfig(task: Task, network: string): boolean {
  const allDelays = _buildTimelockAuthorizerConfig(task, network);

  let taskHasOutput = true;
  try {
    task.output();
  } catch {
    taskHasOutput = false;
  }

  const filePath = path.join(TIMELOCK_AUTHORIZER_CONFIG_DIRECTORY, `${network}.json`);
  const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

  // If the task has an output, there should be a file and vice-versa.
  // If the task has an output, the configuration cannot be empty.
  if (taskHasOutput !== fileExists || (taskHasOutput && Object.keys(allDelays).length === 0)) {
    return false;
  }

  // Load the existing content if any exists.
  const existingFileContents: string = fileExists ? fs.readFileSync(filePath).toString() : '{}';

  return _stringifyEntries(allDelays) === existingFileContents;
}

/**
 * Builds an object that contains the information for Grant delays and Execute delays.
 * The resulting format reads as follows:
 * grantDelays: [
 *   {
 *     "actionId": {
 *       "taskId": "<task-name>",
 *       "contractName": "<contract-name>",
 *       "useAdaptor": <true | false>,
 *       "signature": "<function-signature>",
 *       "actionId": "<action-id-hash>"
 *     },
 *     "delay": {
 *       "label": "<human-readable-delay>",
 *       "value": <delay-in-seconds>
 *     }
 *   },
 * ],
 * executeDelays: [
 *  (...)
 * ]
 * (...)
 */
function _buildTimelockAuthorizerConfig(task: Task, network: string): object {
  const settings = task.settings();

  const grantDelays =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.GrantDelays?.map((grantDelay: any) => {
      return {
        actionId: getActionIdInfo(grantDelay.actionId, network),
        delay: {
          label: timestampToString(grantDelay.newDelay),
          value: grantDelay.newDelay,
        },
      };
    });

  const executeDelays =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.ExecuteDelays?.map((executeDelay: any) => {
      return {
        actionId: getActionIdInfo(executeDelay.actionId, network),
        delay: {
          label: timestampToString(executeDelay.newDelay),
          value: executeDelay.newDelay,
        },
      };
    });

  if (grantDelays === undefined && executeDelays === undefined) {
    return {};
  }

  return {
    grantDelays,
    executeDelays,
  };
}

function _stringifyEntries(entries: object): string {
  return JSON.stringify(entries, null, 2);
}
