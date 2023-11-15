import fs from 'fs';
import path from 'path';
import Task, { TaskStatus } from './task';

import { Network } from './types';
import { getActionIdInfo } from 'actionId';
import { timestampToString } from '@helpers/time';
import { BigNumber } from 'ethers';
import { bn, decimal } from '@helpers/numbers';
import retry from 'async-retry';

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
 * It is based on the input configuration in the deployment task for the given network.
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
  // Returns an empty object if there are no delays defined
  const allDelays = _buildTimelockAuthorizerConfig(task, network);

  const taskHasOutput = task.hasOutput();

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTimelockAuthorizerConfigDiff(task: Task, network: string): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diff: any[] = [];

  if (!task.hasOutput()) {
    // If the contract is not deployed for this network, return early.
    return diff;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDelays: any = _buildTimelockAuthorizerConfig(task, network);

  const timelockAuthorizer = await task.deployedInstance('TimelockAuthorizer');

  for (const delayInfo of allDelays.grantDelays) {
    const actionId = delayInfo.actionIdInfo.actionId;
    const onchainDelay: BigNumber = await timelockAuthorizer.getActionIdGrantDelay(actionId);

    if (!onchainDelay.eq(bn(delayInfo.delay.value))) {
      diff.push({
        actionId: delayInfo.actionIdInfo,
        onchainDelay: decimal(onchainDelay),
        expectedDelay: delayInfo.delay.value,
        type: 'Grant',
      });
    }
  }

  for (const delayInfo of allDelays.executeDelays) {
    const actionId = delayInfo.actionIdInfo.actionId;
    const onchainDelay: BigNumber = await timelockAuthorizer.getActionIdDelay(actionId);

    if (!onchainDelay.eq(bn(delayInfo.delay.value))) {
      diff.push({
        actionId: delayInfo.actionIdInfo,
        onchainDelay: decimal(onchainDelay),
        expectedDelay: delayInfo.delay.value,
        type: 'Execute',
      });
    }
  }

  return diff;
}

export async function withRetries(f: () => Promise<void>): Promise<void> {
  await retry(async () => f(), {
    retries: 5, // Number of retries before giving up
    factor: 2, // Exponential factor
    minTimeout: 1000, // Minimum wait time before retrying
    maxTimeout: 10000, // Maximum wait time before retrying
    randomize: true, // Randomize the wait time
  });
}

/**
 * Builds an object that contains the information for Grant delays and Execute delays.
 * The resulting format reads as follows:
 * grantDelays: [
 *   {
 *     "actionIdInfo": {
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
        actionIdInfo: getActionIdInfo(grantDelay.actionId, network),
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
        actionIdInfo: getActionIdInfo(executeDelay.actionId, network),
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
