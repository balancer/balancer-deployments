import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

import { Account } from '../types/types';
import { BigNumberish } from '../../numbers';

export type TimelockAuthorizerDeployment = {
  vault?: Account;
  root?: SignerWithAddress;
  nextRoot?: Account;
  rootTransferDelay?: BigNumberish;
  from?: SignerWithAddress;
};
