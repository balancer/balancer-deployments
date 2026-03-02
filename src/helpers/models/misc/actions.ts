import { Contract } from 'ethers';
import { Interface } from 'ethers';

export const actionId = (instance: Contract, method: string, contractInterface?: Interface): Promise<string> => {
  const selector = (contractInterface ?? instance.interface).getSighash(method);
  return instance.getActionId(selector);
};
