import { BigNumberish, ContractTransactionReceipt, Interface } from 'ethers';
import * as expectEvent from './expectEvent';
import { Account, toAddress } from './models/types/types';

export function expectTransferEvent(
  receipt: ContractTransactionReceipt,
  args: { from?: string; to?: string; value?: BigNumberish },
  token: Account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if ((receipt.to ?? '').toLowerCase() === toAddress(token).toLowerCase()) {
    return expectEvent.inReceipt(receipt, 'Transfer', args);
  }
  return expectEvent.inIndirectReceipt(
    receipt,
    new Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']),
    'Transfer',
    args,
    toAddress(token)
  );
}
