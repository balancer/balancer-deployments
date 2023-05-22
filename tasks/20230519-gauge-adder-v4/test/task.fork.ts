import hre from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { fp } from '@helpers/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import * as expectEvent from '@helpers/expectEvent';

import { describeForkTest } from '@src';
import { Task, TaskMode } from '@src';
import { getForkedNetwork } from '@src';
import { getSigner, impersonate } from '@src';
import { actionId } from '@helpers/models/misc/actions';
import { ZERO_ADDRESS } from '@helpers/constants';

describeForkTest('GaugeAdderV4', 'mainnet', 17295800, function () {
  let factory: Contract;
  let adaptorEntrypoint: Contract;
  let authorizer: Contract;
  let gaugeAdder: Contract;
  let daoMultisig: SignerWithAddress;
  let gaugeController: Contract;

  let task: Task, mainnetGaugeFactoryTask: Task;

  const LP_TOKEN = '0xbc5F4f9332d8415AAf31180Ab4661c9141CC84E4';
  const DAO_MULTISIG = '0x10a19e7ee7d7f8a52822f6817de8ea18204f2e4f';

  const weightCap = fp(0.001);

  before('run Gauge Adder task', async () => {
    task = new Task('20230519-gauge-adder-v4', TaskMode.TEST, getForkedNetwork(hre));
    await task.run({ force: true });
    gaugeAdder = await task.deployedInstance('GaugeAdder');
  });

  before('setup accounts', async () => {
    daoMultisig = await impersonate(DAO_MULTISIG, fp(100));
  });

  before('setup contracts', async () => {
    const authorizerWrapperTask = new Task('20221124-authorizer-adaptor-entrypoint', TaskMode.READ_ONLY, 'mainnet');
    adaptorEntrypoint = await authorizerWrapperTask.deployedInstance('AuthorizerAdaptorEntrypoint');

    // At this block we have the authorizer wrapper in place, which is adaptor entrypoint aware.
    const authorizerTask = new Task('20210418-authorizer', TaskMode.READ_ONLY, getForkedNetwork(hre));
    authorizer = await authorizerTask.deployedInstance('Authorizer');

    // We'll need this task later on.
    mainnetGaugeFactoryTask = new Task('20220822-mainnet-gauge-factory-v2', TaskMode.READ_ONLY, 'mainnet');
  });

  context('construction', () => {
    it('stores the entrypoint', async () => {
      expect(await gaugeAdder.getAuthorizerAdaptorEntrypoint()).to.equal(adaptorEntrypoint.address);
    });

    it('stores the gauge controller', async () => {
      const gaugeControllerTask = new Task('20220325-gauge-controller', TaskMode.READ_ONLY, getForkedNetwork(hre));
      gaugeController = await gaugeControllerTask.deployedInstance('GaugeController');

      // Ensure we can call functions on the gaugeController
      const controllerAdmin = await gaugeController.admin();
      expect(controllerAdmin).to.not.equal(ZERO_ADDRESS);
      expect(await gaugeController.gauge_exists(ZERO_ADDRESS)).to.be.false;

      expect(await gaugeAdder.getGaugeController()).to.equal(gaugeController.address);
    });
  });

  context('advanced functions', () => {
    let admin: SignerWithAddress;
    let gauge: Contract;

    before('load accounts', async () => {
      admin = await getSigner(0);
    });

    before('create gauge factory', async () => {
      const factoryTask = new Task('20220822-mainnet-gauge-factory-v2', TaskMode.TEST, getForkedNetwork(hre));
      await factoryTask.run({ force: true });
      factory = await factoryTask.deployedInstance('LiquidityGaugeFactory');

      expect(await factory.isGaugeFromFactory(ZERO_ADDRESS)).to.be.false;
    });

    // We need to grant permission to the admin to add the LiquidityGaugeFactory to the GaugeAdder, and also to add
    // gauges from said factory to the GaugeController.
    before('grant permissions', async () => {
      const addGaugeTypeAction = await actionId(gaugeAdder, 'addGaugeType');
      const setFactoryAction = await actionId(gaugeAdder, 'setGaugeFactory');
      const addGaugeAction = await actionId(gaugeAdder, 'addGauge');
      const gaugeControllerAddGaugeAction = await actionId(
        adaptorEntrypoint,
        'add_gauge(address,int128)',
        gaugeController.interface
      );

      await authorizer.connect(daoMultisig).grantRole(addGaugeTypeAction, admin.address);
      await authorizer.connect(daoMultisig).grantRole(setFactoryAction, admin.address);
      await authorizer.connect(daoMultisig).grantRole(addGaugeAction, admin.address);
      await authorizer.connect(daoMultisig).grantRole(gaugeControllerAddGaugeAction, gaugeAdder.address);
    });

    it('can add a gauge type', async () => {
      const tx = await gaugeAdder.connect(admin).addGaugeType('Ethereum');
      const receipt = await tx.wait();

      // `expectEvent` does not work with indexed strings, so we decode the pieces we are interested in manually.
      // One event in receipt, named `GaugeTypeAdded`
      expect(receipt.events.length).to.be.eq(1);
      const event = receipt.events[0];
      expect(event.event).to.be.eq('GaugeTypeAdded');

      // Contains expected `gaugeType` and `gaugeFactory`.
      const decodedArgs = event.decode(event.data);
      expect(decodedArgs.gaugeType).to.be.eq('Ethereum');
    });

    it('returns the added type correctly', async () => {
      expect(await gaugeAdder.getGaugeTypesCount()).to.eq(1);
      expect(await gaugeAdder.getGaugeTypes()).to.deep.eq(['Ethereum']);
      expect(await gaugeAdder.getGaugeTypeAtIndex(0)).to.eq('Ethereum');
      expect(await gaugeAdder.isValidGaugeType('Ethereum')).to.be.true;
      expect(await gaugeAdder.isValidGaugeType('ZkSync')).to.be.false;
    });

    it('can add factories for a gauge type', async () => {
      const tx = await gaugeAdder.connect(admin).setGaugeFactory(factory.address, 'Ethereum'); // Ethereum is type 2
      const receipt = await tx.wait();
      // `expectEvent` does not work with indexed strings, so we decode the pieces we are interested in manually.
      // One event in receipt, named `GaugeFactorySet`
      expect(receipt.events.length).to.be.eq(1);
      const event = receipt.events[0];
      expect(event.event).to.be.eq('GaugeFactorySet');

      // Contains expected `gaugeType` and `gaugeFactory`.
      const decodedArgs = event.decode(event.data);
      expect(decodedArgs.gaugeType).to.be.eq('Ethereum');
      expect(decodedArgs.gaugeFactory).to.be.eq(factory.address);
    });

    it('returns added factory correctly', async () => {
      expect(await gaugeAdder.getFactoryForGaugeType('Ethereum')).to.eq(factory.address);
    });

    it('can add gauge to adder and controller', async () => {
      const tx = await factory.create(LP_TOKEN, weightCap);
      const event = expectEvent.inReceipt(await tx.wait(), 'GaugeCreated');
      gauge = await mainnetGaugeFactoryTask.instanceAt('LiquidityGaugeV5', event.args.gauge);

      await gaugeAdder.connect(admin).addGauge(gauge.address, 'Ethereum');

      expect(await gaugeAdder.isGaugeFromValidFactory(gauge.address, 'Ethereum')).to.be.true;
      expect(await gaugeController.gauge_exists(gauge.address)).to.be.true;
    });
  });
});
