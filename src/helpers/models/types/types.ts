import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { BigNumberish } from '@ethersproject/bignumber';

export type NAry<T> = T | Array<T>;

export type Account = string | SignerWithAddress | Contract | { address: string };

export type TxParams = {
  from?: SignerWithAddress;
};

export enum PoolSpecialization {
  GeneralPool = 0,
  MinimalSwapInfoPool,
  TwoTokenPool,
}

export type FundManagement = {
  sender: string;
  fromInternalBalance: boolean;
  recipient: string;
  toInternalBalance: boolean;
};

// Swaps

export enum SwapKind {
  GivenIn = 0,
  GivenOut,
}

export type SingleSwap = {
  poolId: string;
  kind: SwapKind;
  assetIn: string;
  assetOut: string;
  amount: BigNumberish;
  userData: string;
};

export type Swap = {
  kind: SwapKind;
  singleSwap: SingleSwap;
  limit: BigNumberish;
  deadline: BigNumberish;
};

export type BatchSwapStep = {
  poolId: string;
  assetInIndex: number;
  assetOutIndex: number;
  amount: BigNumberish;
  userData: string;
};

export type BatchSwap = {
  kind: SwapKind;
  swaps: BatchSwapStep[];
  assets: string[];
  funds: FundManagement;
  limits: BigNumberish[];
  deadline: BigNumberish;
};

export type SwapRequest = {
  kind: SwapKind;
  tokenIn: string;
  tokenOut: string;
  amount: BigNumberish;
  poolId: string;
  lastChangeBlock: BigNumberish;
  from: string;
  to: string;
  userData: string;
};

// Joins

export type JoinPoolRequest = {
  assets: string[];
  maxAmountsIn: BigNumberish[];
  userData: string;
  fromInternalBalance: boolean;
};

// Exit

export type ExitPoolRequest = {
  assets: string[];
  minAmountsOut: BigNumberish[];
  userData: string;
  toInternalBalance: boolean;
};

// Balance Operations

export enum UserBalanceOpKind {
  DepositInternal = 0,
  WithdrawInternal,
  TransferInternal,
  TransferExternal,
}

export type UserBalanceOp = {
  kind: UserBalanceOpKind;
  asset: string;
  amount: BigNumberish;
  sender: string;
  recipient: string;
};

export enum PoolBalanceOpKind {
  Withdraw = 0,
  Deposit = 1,
  Update = 2,
}

export type PoolBalanceOp = {
  kind: PoolBalanceOpKind;
  poolId: string;
  token: string;
  amount: BigNumberish;
};

// Stakeless gauges

export enum GaugeType {
  LiquidityMiningCommittee = 0,
  veBAL,
  Ethereum,
  Polygon,
  Arbitrum,
  Optimism,
  Gnosis,
  ZkSync,
}

export type ManagedPoolParams = {
  name: string;
  symbol: string;
  assetManagers: string[];
};

export type ManagedPoolSettingsParams = {
  tokens: string[];
  normalizedWeights: BigNumberish[];
  swapFeePercentage: BigNumberish;
  swapEnabledOnStart: boolean;
  mustAllowlistLPs: boolean;
  managementAumFeePercentage: BigNumberish;
  aumFeeId: BigNumberish;
};

export enum ProtocolFee {
  SWAP = 0,
  FLASH_LOAN = 1,
  YIELD = 2,
  AUM = 3,
}
