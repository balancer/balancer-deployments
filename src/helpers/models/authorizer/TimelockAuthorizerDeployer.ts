import { ethers } from 'hardhat';

import { MONTH } from '@helpers/time';
import { deploy } from '@src';
import { TimelockAuthorizerDeployment } from './types';

import TimelockAuthorizer from './TimelockAuthorizer';
import { ZERO_ADDRESS } from '@helpers/constants';
import { Account } from '../types/types';

export default {
  async deploy(deployment: TimelockAuthorizerDeployment): Promise<TimelockAuthorizer> {
    const root = deployment.root || deployment.from || (await ethers.getSigners())[0];
    const nextRoot = deployment.nextRoot || ZERO_ADDRESS;
    const rootTransferDelay = deployment.rootTransferDelay || MONTH;
    const entrypoint = await deploy('MockAuthorizerAdaptorEntrypoint');
    const args = [toAddress(root), toAddress(nextRoot), entrypoint.address, rootTransferDelay];
    const instance = await deploy('TimelockAuthorizer', args);
    return new TimelockAuthorizer(instance, root);
  },
};

function toAddress(to?: Account): string {
  if (!to) return ZERO_ADDRESS;
  return typeof to === 'string' ? to : to.address;
}
