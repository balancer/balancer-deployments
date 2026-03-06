import { Contract } from 'ethers';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/types';
import type { Artifact } from 'hardhat/types/artifacts';

export type { Artifact };
export type Libraries = Record<string, string>;
export type SignerWithAddress = HardhatEthersSigner;

import Task from './task';

export const NETWORKS = [
  'mainnet',
  'polygon',
  'arbitrum',
  'optimism',
  'gnosis',
  'bsc',
  'avalanche',
  'zkevm',
  'sepolia',
  'base',
  'fraxtal',
  'mode',
  'hyperevm',
  'plasma',
  'xlayer',
  'monad',
];

export type Network = (typeof NETWORKS)[number];

export type TaskRunOptions = {
  force?: boolean;
  from?: SignerWithAddress;
};

export type NAry<T> = T | Array<T>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Param = boolean | string | number | bigint | any;

export type Input = {
  [key: string]: NAry<Param>;
};

export type RawInputByNetwork = {
  [key in Network]: RawInputKeyValue;
};

export type RawInputKeyValue = {
  [key: string]: NAry<Param> | Output | Task;
};

export type RawInput = RawInputKeyValue | RawInputByNetwork;

export type Output = {
  [key: string]: string;
};

export type RawOutput = {
  [key: string]: string | Contract;
};
