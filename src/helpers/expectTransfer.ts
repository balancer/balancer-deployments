import { BigNumberish, ContractReceipt } from 'ethers';
import * as expectEvent from './expectEvent';
import { Interface } from 'ethers/lib/utils';
import { Account } from './models/types/types';
import { ZERO_ADDRESS } from './constants';

export function expectTransferEvent(
  receipt: ContractReceipt,
  args: { from?: string; to?: string; value?: BigNumberish },
  token: Account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (receipt.to.toLowerCase() === toAddress(token).toLowerCase()) {
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

function toAddress(to?: Account): string {
  if (!to) return ZERO_ADDRESS;
  return typeof to === 'string' ? to : to.address;
}
