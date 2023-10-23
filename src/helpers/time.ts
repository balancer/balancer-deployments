import { BigNumber, ContractReceipt } from 'ethers';

import { BigNumberish, bn } from './numbers';

import { time } from '@nomicfoundation/hardhat-network-helpers';

export const currentTimestamp = async (): Promise<BigNumber> => {
  return bn(await time.latest());
};

export const currentWeekTimestamp = async (): Promise<BigNumber> => {
  return (await currentTimestamp()).div(WEEK).mul(WEEK);
};

export const fromNow = async (seconds: number): Promise<BigNumber> => {
  const now = await currentTimestamp();
  return now.add(seconds);
};

export const advanceTime = async (seconds: BigNumberish): Promise<void> => {
  await time.increase(seconds);
};

export const advanceToTimestamp = async (timestamp: BigNumberish): Promise<void> => {
  await time.increaseTo(timestamp);
};

export const setNextBlockTimestamp = async (timestamp: BigNumberish): Promise<void> => {
  await time.setNextBlockTimestamp(timestamp);
};

export const lastBlockNumber = async (): Promise<number> => await time.latestBlock();

export const receiptTimestamp = async (receipt: ContractReceipt | Promise<ContractReceipt>): Promise<number> => {
  const { ethers } = await import('hardhat');

  const blockHash = (await receipt).blockHash;
  const block = await ethers.provider.getBlock(blockHash);
  return block.timestamp;
};

export const SECOND = 1;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
export const MONTH = DAY * 30;

export const timestampToString = (timestamp: number): string => {
  if (timestamp >= SECOND && timestamp < MINUTE) {
    return `${timestamp} ${timestamp > SECOND ? 'seconds' : 'second'}`;
  } else if (timestamp >= MINUTE && timestamp < HOUR) {
    return `${timestamp / MINUTE} ${timestamp > MINUTE ? 'minutes' : 'minute'}`;
  } else if (timestamp >= HOUR && timestamp < DAY) {
    return `${timestamp / HOUR} ${timestamp > HOUR ? 'hours' : 'hour'}`;
  } else if (timestamp >= DAY && timestamp < MONTH) {
    return `${timestamp / DAY} ${timestamp > DAY ? 'days' : 'day'}`;
  } else {
    return `${timestamp / MONTH} ${timestamp > MONTH ? 'months' : 'month'}`;
  }
};
