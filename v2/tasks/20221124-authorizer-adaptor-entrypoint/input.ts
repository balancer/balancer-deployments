import { Task, TaskMode } from '@src';

export type AuthorizerAdaptorEntrypointDeployment = {
  AuthorizerAdaptor: string;
};

const AuthorizerAdaptor = new Task('20220325-authorizer-adaptor', TaskMode.READ_ONLY);

export default {
  AuthorizerAdaptor,
};
