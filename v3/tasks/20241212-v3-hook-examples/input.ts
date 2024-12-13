import { Task, TaskMode } from '@src';

export type HookExamplesDeployment = {
  Vault: string;
  StablePoolFactory: string;
  Router: string;
};

const Vault = new Task('v3-vault-11', TaskMode.READ_ONLY);
const StablePoolFactory = new Task('v3-stable-pool-11', TaskMode.READ_ONLY);
const Router = new Task('v3-routers-11', TaskMode.READ_ONLY);

export default {
  Vault,
  StablePoolFactory,
  Router,
};
