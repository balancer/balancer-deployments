import { Contract, ContractTransactionResponse, Interface } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

import * as expectEvent from '@helpers/expectEvent';
import { BigNumberish } from '@helpers/numbers';
import { ANY_ADDRESS } from '@helpers/constants';
import { advanceToTimestamp } from '@helpers/time';

import TimelockAuthorizerDeployer from './TimelockAuthorizerDeployer';
import { TimelockAuthorizerDeployment } from './types';
import { Account, NAry, TxParams, toAddress } from '../types/types';

export default class TimelockAuthorizer {
  static EVERYWHERE = ANY_ADDRESS;

  instance: Contract;
  root: SignerWithAddress;

  static async create(deployment: TimelockAuthorizerDeployment = {}): Promise<TimelockAuthorizer> {
    return TimelockAuthorizerDeployer.deploy(deployment);
  }

  constructor(instance: Contract, root: SignerWithAddress) {
    this.instance = instance;
    this.root = root;
  }

  get address(): string {
    return this.instance.target.toString();
  }

  get interface(): Interface {
    return this.instance.interface;
  }

  async hasPermission(action: string, account: Account, where: Account): Promise<boolean> {
    return this.instance.hasPermission(action, toAddress(account), toAddress(where));
  }

  async getPermissionId(action: string, account: Account, where: Account): Promise<string> {
    return this.instance.getPermissionId(action, toAddress(account), toAddress(where));
  }

  async isRoot(account: Account): Promise<boolean> {
    return this.instance.isRoot(toAddress(account));
  }

  async isPendingRoot(account: Account): Promise<boolean> {
    return this.instance.isPendingRoot(toAddress(account));
  }

  async isExecutor(scheduledExecutionId: BigNumberish, account: Account): Promise<boolean> {
    return this.instance.isExecutor(scheduledExecutionId, toAddress(account));
  }

  async isCanceler(scheduledExecutionId: BigNumberish, account: Account): Promise<boolean> {
    return this.instance.isCanceler(scheduledExecutionId, toAddress(account));
  }

  async delay(action: string): Promise<bigint> {
    return this.instance.getActionIdDelay(action);
  }

  async getActionIdRevokeDelay(actionId: string): Promise<bigint> {
    return this.instance.getActionIdRevokeDelay(actionId);
  }

  async getActionIdGrantDelay(actionId: string): Promise<bigint> {
    return this.instance.getActionIdGrantDelay(actionId);
  }

  async getScheduledExecution(id: BigNumberish): Promise<{
    executed: boolean;
    cancelled: boolean;
    protected: boolean;
    executableAt: bigint;
    data: string;
    where: string;
  }> {
    return this.instance.getScheduledExecution(id);
  }

  async canPerform(action: string, account: Account, where: Account): Promise<boolean> {
    return this.instance.canPerform(action, toAddress(account), toAddress(where));
  }

  async isGranter(actionId: string, account: Account, where: Account): Promise<boolean> {
    return this.instance.isGranter(actionId, toAddress(account), toAddress(where));
  }

  async isRevoker(account: Account, where: Account): Promise<boolean> {
    return this.instance.isRevoker(toAddress(account), toAddress(where));
  }

  async scheduleRootChange(root: Account, executors: Account[], params?: TxParams): Promise<number> {
    const receipt = await this.with(params).scheduleRootChange(toAddress(root), this.toAddresses(executors));
    const event = expectEvent.inReceipt((await receipt.wait())!, 'RootChangeScheduled', {
      newRoot: toAddress(root),
    });
    return event.args.scheduledExecutionId;
  }

  async claimRoot(params?: TxParams): Promise<ContractTransactionResponse> {
    return this.with(params).claimRoot();
  }

  async scheduleDelayChange(
    action: string,
    delay: BigNumberish,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleDelayChange(action, delay, this.toAddresses(executors));
    const event = expectEvent.inReceipt((await receipt.wait())!, 'DelayChangeScheduled', {
      actionId: action,
      newDelay: delay,
    });
    return event.args.scheduledExecutionId;
  }

  async scheduleGrantDelayChange(
    action: string,
    delay: BigNumberish,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleGrantDelayChange(action, delay, this.toAddresses(executors));
    const event = expectEvent.inReceipt((await receipt.wait())!, 'GrantDelayChangeScheduled', {
      actionId: action,
      newDelay: delay,
    });
    return event.args.scheduledExecutionId;
  }

  async scheduleRevokeDelayChange(
    action: string,
    delay: BigNumberish,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleRevokeDelayChange(action, delay, this.toAddresses(executors));
    const event = expectEvent.inReceipt((await receipt.wait())!, 'RevokeDelayChangeScheduled', {
      actionId: action,
      newDelay: delay,
    });
    return event.args.scheduledExecutionId;
  }

  async schedule(where: Account, data: string, executors: Account[], params?: TxParams): Promise<number> {
    const receipt = await this.with(params).schedule(toAddress(where), data, this.toAddresses(executors));
    const event = expectEvent.inReceipt((await receipt.wait())!, 'ExecutionScheduled');

    return event.args.scheduledExecutionId;
  }

  async scheduleGrantPermission(
    action: string,
    account: Account,
    where: Account,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleGrantPermission(
      action,
      toAddress(account),
      toAddress(where),
      this.toAddresses(executors)
    );

    const event = expectEvent.inReceipt((await receipt.wait())!, 'GrantPermissionScheduled', {
      actionId: action,
      account: toAddress(account),
      where: toAddress(where),
    });

    return event.args.scheduledExecutionId;
  }

  async scheduleRevokePermission(
    action: string,
    account: Account,
    where: Account,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleRevokePermission(
      action,
      toAddress(account),
      toAddress(where),
      this.toAddresses(executors)
    );

    const event = expectEvent.inReceipt((await receipt.wait())!, 'RevokePermissionScheduled', {
      actionId: action,
      account: toAddress(account),
      where: toAddress(where),
    });

    return event.args.scheduledExecutionId;
  }

  async execute(id: BigNumberish, params?: TxParams): Promise<ContractTransactionResponse> {
    return this.with(params).execute(id);
  }

  async cancel(id: BigNumberish, params?: TxParams): Promise<ContractTransactionResponse> {
    return this.with(params).cancel(id);
  }

  async addCanceler(
    scheduledExecutionId: BigNumberish,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).addCanceler(scheduledExecutionId, toAddress(account));
  }

  async removeCanceler(
    scheduledExecutionId: BigNumberish,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).removeCanceler(scheduledExecutionId, toAddress(account));
  }

  async addGranter(
    action: string,
    account: Account,
    where: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).addGranter(action, toAddress(account), toAddress(where));
  }

  async removeGranter(
    action: string,
    account: Account,
    wheres: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).removeGranter(action, toAddress(account), toAddress(wheres));
  }

  async addRevoker(account: Account, where: Account, params?: TxParams): Promise<ContractTransactionResponse> {
    return this.with(params).addRevoker(toAddress(account), toAddress(where));
  }

  async removeRevoker(account: Account, wheres: Account, params?: TxParams): Promise<ContractTransactionResponse> {
    return this.with(params).removeRevoker(toAddress(account), toAddress(wheres));
  }

  async grantPermission(
    action: string,
    account: Account,
    where: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).grantPermission(action, toAddress(account), toAddress(where));
  }

  async revokePermission(
    action: string,
    account: Account,
    where: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).revokePermission(action, toAddress(account), toAddress(where));
  }

  async renouncePermission(action: string, where: Account, params?: TxParams): Promise<ContractTransactionResponse> {
    return this.with(params).renouncePermission(action, toAddress(where));
  }

  async grantPermissionGlobally(
    action: string,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).grantPermission(action, toAddress(account), TimelockAuthorizer.EVERYWHERE);
  }

  async revokePermissionGlobally(
    action: string,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransactionResponse> {
    return this.with(params).revokePermission(action, toAddress(account), TimelockAuthorizer.EVERYWHERE);
  }

  async renouncePermissionGlobally(action: string, params: TxParams): Promise<ContractTransactionResponse> {
    return this.with(params).renouncePermission(action, TimelockAuthorizer.EVERYWHERE);
  }

  async scheduleAndExecuteDelayChange(action: string, delay: number, params?: TxParams): Promise<void> {
    const id = await this.scheduleDelayChange(action, delay, [], params);
    await advanceToTimestamp((await this.getScheduledExecution(id)).executableAt);
    await this.execute(id);
  }

  async scheduleAndExecuteGrantDelayChange(action: string, delay: number, params?: TxParams): Promise<void> {
    const id = await this.scheduleGrantDelayChange(action, delay, [], params);
    await advanceToTimestamp((await this.getScheduledExecution(id)).executableAt);
    await this.execute(id);
  }

  async scheduleAndExecuteRevokeDelayChange(action: string, delay: number, params?: TxParams): Promise<void> {
    const id = await this.scheduleRevokeDelayChange(action, delay, [], params);
    await advanceToTimestamp((await this.getScheduledExecution(id)).executableAt);
    await this.execute(id);
  }

  toAddresses(accounts: NAry<Account>): string[] {
    return this.toList(accounts).map(toAddress);
  }

  toList<T>(items: NAry<T>): T[] {
    return Array.isArray(items) ? items : [items];
  }

  with(params: TxParams = {}): Contract {
    return (params.from ? this.instance.connect(params.from) : this.instance) as Contract;
  }
}
