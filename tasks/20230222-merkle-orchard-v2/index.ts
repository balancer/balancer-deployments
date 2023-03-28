import { Task, TaskRunOptions } from '@src';
import { MerkleOrchardDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as MerkleOrchardDeployment;

  const merkleOrchardArgs = [input.Vault];
  await task.deployAndVerify('MerkleOrchard', merkleOrchardArgs, from, force);
};
