import { Task, TaskMode } from '@src';

export type BalancerContractRegistryInitializerDeployment = {
  Vault: string;
  BalancerContractRegistry: string;
  RouterName: string;
  Router: string;
  BatchRouterName: string;
  BatchRouter: string;
  BufferRouterName: string;
  BufferRouter: string;
  CompositeLiquidityRouterName: string;
  CompositeLiquidityRouter: string;
  AggregatorRouterName;
  AggregatorBatchRouterName;
  WeightedPoolName: string;
  WeightedPoolFactory: string;
  StablePoolName: string;
  StablePoolFactory: string;
  StableSurgePoolName: string;
  StableSurgePoolFactory: string;
  Gyro2CLPName: string;
  Gyro2CLPPoolFactory: string;
  GyroECLPName: string;
  GyroECLPPoolFactory: string;
  ReClammPoolName: string;
  ReClammPoolFactory: string;
  AggregatorRouter: string;
  AggregatorBatchRouter: string;
  WeightedPoolAlias: string;
  StablePoolAlias: string;
  RouterAlias: string;
  BatchRouterAlias: string;
  StableSurgePoolAlias: string;
  Gyro2CLPAlias: string;
  GyroECLPAlias: string;
  ReClammAlias: string;
  AggregatorRouterAlias: string;
  AggregatorBatchRouterAlias: string;
  CompositeLiquidityRouterAlias: string;
};

const RouterName = '20250307-v3-router-v2';
const BatchRouterName = '20241205-v3-batch-router';
const BufferRouterName = '20241205-v3-buffer-router';
const CompositeLiquidityRouterName = '20250123-v3-composite-liquidity-router-v2';
const WeightedPoolName = '20241205-v3-weighted-pool';
const StablePoolName = '20250324-v3-stable-pool-v2'; // Upgraded to V2
const StableSurgePoolName = '20250404-v3-stable-surge-pool-factory-v2'; // Upgraded to V2
const Gyro2CLPName = '20250120-v3-gyro-2clp'; // Added
const GyroECLPName = '20250124-v3-gyro-eclp'; // Added
const ReClammPoolName = '20250702-v3-reclamm-pool-v2'; // Added
const AggregatorRouterName = '20250218-v3-aggregator-router';
const AggregatorBatchRouterName = '20250507-v3-aggregator-batch-router';

const Vault = new Task('20241204-v3-vault', TaskMode.READ_ONLY);
const BalancerContractRegistry = new Task('20250117-v3-contract-registry', TaskMode.READ_ONLY);

const Router = new Task(RouterName, TaskMode.READ_ONLY);
const BatchRouter = new Task(BatchRouterName, TaskMode.READ_ONLY);
const BufferRouter = new Task(BufferRouterName, TaskMode.READ_ONLY);
const CompositeLiquidityRouter = new Task(CompositeLiquidityRouterName, TaskMode.READ_ONLY);
const WeightedPoolFactory = new Task(WeightedPoolName, TaskMode.READ_ONLY);
const StablePoolFactory = new Task(StablePoolName, TaskMode.READ_ONLY);
const StableSurgePoolFactory = new Task(StableSurgePoolName, TaskMode.READ_ONLY);
const Gyro2CLPPoolFactory = new Task(Gyro2CLPName, TaskMode.READ_ONLY);
const GyroECLPPoolFactory = new Task(GyroECLPName, TaskMode.READ_ONLY);
const ReClammPoolFactory = new Task(ReClammPoolName, TaskMode.READ_ONLY);
const AggregatorRouter = new Task(AggregatorRouterName, TaskMode.READ_ONLY);
const AggregatorBatchRouter = new Task(AggregatorBatchRouterName, TaskMode.READ_ONLY);

const WeightedPoolAlias = 'WeightedPool';
const StablePoolAlias = 'StablePool';
const StableSurgePoolAlias = 'StableSurgePool';
const Gyro2CLPAlias = 'Gyro2CLP';
const GyroECLPAlias = 'GyroECLP';
const ReClammAlias = 'ReClammPool';
const RouterAlias = 'Router';
const BatchRouterAlias = 'BatchRouter';
const CompositeLiquidityRouterAlias = 'CompositeLiquidityRouter';
const AggregatorRouterAlias = 'AggregatorRouter';
const AggregatorBatchRouterAlias = 'AggregatorBatchRouter';

export default {
  Vault,
  BalancerContractRegistry,
  RouterName,
  Router,
  BatchRouterName,
  BatchRouter,
  BufferRouterName,
  BufferRouter,
  CompositeLiquidityRouterName,
  CompositeLiquidityRouter,
  AggregatorRouterName,
  AggregatorRouter,
  AggregatorBatchRouterName,
  AggregatorBatchRouter,
  WeightedPoolName,
  WeightedPoolFactory,
  StablePoolName,
  StablePoolFactory,
  StableSurgePoolName,
  StableSurgePoolFactory,
  Gyro2CLPName,
  Gyro2CLPPoolFactory,
  GyroECLPName,
  GyroECLPPoolFactory,
  ReClammPoolName,
  ReClammPoolFactory,
  WeightedPoolAlias,
  StablePoolAlias,
  RouterAlias,
  BatchRouterAlias,
  StableSurgePoolAlias,
  Gyro2CLPAlias,
  GyroECLPAlias,
  ReClammAlias,
  AggregatorRouterAlias,
  AggregatorBatchRouterAlias,
  CompositeLiquidityRouterAlias,
};
