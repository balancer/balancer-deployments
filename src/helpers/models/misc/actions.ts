import { Contract, Interface } from 'ethers';

export const actionId = (instance: Contract, method: string, contractInterface?: Interface): Promise<string> => {
  const selector = (contractInterface ?? instance.interface).getFunction(method)!.selector;
  return instance.getActionId(selector);
};
