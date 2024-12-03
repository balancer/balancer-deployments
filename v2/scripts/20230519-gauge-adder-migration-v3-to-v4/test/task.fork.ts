import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';

import { fp } from '@helpers/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { impersonate } from '@src';
import { actionId } from '@helpers/models/misc/actions';

describeForkTest('GaugeAdderMigrationCoordinator-V3-V4', 'mainnet', 17322200, function () {
  let govMultisig: SignerWithAddress;
  let coordinator: Contract;

  let authorizer: Contract, authorizerAdaptor: Contract, gaugeController: Contract;

  let oldGaugeAdder: Contract;
  let newGaugeAdder: Contract;

  let task: Task;

  const GOV_MULTISIG = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';

  before('run task', async () => {
    task = new Task('20230519-gauge-adder-migration-v3-to-v4', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    coordinator = await task.deployedInstance('GaugeAdderMigrationCoordinator');
  });

  before('setup contracts', async () => {
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    const authorizerAdaptorTask = new Task('20220325-authorizer-adaptor', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizerAdaptor = await authorizerAdaptorTask.deployedInstance('AuthorizerAdaptor');

    const oldGaugeAdderTask = new Task('20230109-gauge-adder-v3', TaskMode.READ_ONLY, getForkedNetwork(hre));
    oldGaugeAdder = await oldGaugeAdderTask.deployedInstance('GaugeAdder');

    const newGaugeAdderTask = new Task('20230519-gauge-adder-v4', TaskMode.READ_ONLY, getForkedNetwork(hre));
    newGaugeAdder = await newGaugeAdderTask.deployedInstance('GaugeAdder');

    const gaugeControllerTask = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, getForkedNetwork(hre));
    gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');
  });

  before('grant permissions', async () => {
    govMultisig = await impersonate(GOV_MULTISIG, fp(100));

    await authorizer.connect(govMultisig).grantRole(await authorizer.DEFAULT_ADMIN_ROLE(), coordinator.address);
  });

  it('performs first stage', async () => {
    await coordinator.performNextStage();
    expect(await coordinator.getCurrentStage()).to.equal(1);
  });

  it('gauge adder has the expected types set up', async () => {
    const gaugeTypes = await newGaugeAdder.getGaugeTypes();
    expect(gaugeTypes).to.be.deep.eq([
      'Ethereum',
      'Polygon',
      'Arbitrum',
      'Optimism',
      'Gnosis',
      'PolygonZkEvm',
      'ZkSync',
    ]);
  });

  it('gauge adder has the expected factories set up', async () => {
    expect(await newGaugeAdder.getFactoryForGaugeType('Ethereum')).to.equal(task.input().LiquidityGaugeFactory);
    expect(await newGaugeAdder.getFactoryForGaugeType('Polygon')).to.equal(task.input().PolygonRootGaugeFactory);
    expect(await newGaugeAdder.getFactoryForGaugeType('Arbitrum')).to.equal(task.input().ArbitrumRootGaugeFactory);
    expect(await newGaugeAdder.getFactoryForGaugeType('Optimism')).to.equal(task.input().OptimismRootGaugeFactory);
    expect(await newGaugeAdder.getFactoryForGaugeType('Gnosis')).to.equal(task.input().GnosisRootGaugeFactory);
    expect(await newGaugeAdder.getFactoryForGaugeType('PolygonZkEvm')).to.equal(
      task.input().PolygonZkEVMRootGaugeFactory
    );
  });

  it('transfers the rights to add new gauges to the new GaugeAdder', async () => {
    const addGaugePermission = await authorizerAdaptor.getActionId(
      gaugeController.interface.getSighash('add_gauge(address,int128)')
    );

    expect(await authorizer.canPerform(addGaugePermission, oldGaugeAdder.address, authorizerAdaptor.address)).to.be
      .false;
    expect(await authorizer.canPerform(addGaugePermission, newGaugeAdder.address, authorizerAdaptor.address)).to.be
      .true;
  });

  it('grants permissions to the multisig to add gauges of existing types on the new GaugeAdder', async () => {
    const multisig = task.input().LiquidityMiningMultisig;

    const permission = await actionId(newGaugeAdder, 'addGauge');
    expect(await authorizer.canPerform(permission, multisig, newGaugeAdder.address)).to.be.true;
  });

  it('does not hold permission to add gauge types', async () => {
    const permission = await actionId(newGaugeAdder, 'addGaugeType');
    expect(await authorizer.hasRole(permission, coordinator.address)).to.equal(false);
  });

  it('does not hold permission to set gauge factories', async () => {
    const permission = await actionId(newGaugeAdder, 'setGaugeFactory');
    expect(await authorizer.hasRole(permission, coordinator.address)).to.equal(false);
  });

  it('does not hold permission to add gauges', async () => {
    const permission = await actionId(newGaugeAdder, 'addGauge');
    expect(await authorizer.hasRole(permission, coordinator.address)).to.equal(false);
  });

  it('renounces the admin role', async () => {
    expect(await authorizer.hasRole(await authorizer.DEFAULT_ADMIN_ROLE(), coordinator.address)).to.equal(false);
  });
});
