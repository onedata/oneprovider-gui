import hbs from 'htmlbars-inline-precompile';
import { find } from '@ember/test-helpers';
import FileDistributionViewModel from 'oneprovider-gui/utils/file-distribution-view-model';
import { lookupService } from './stub-service';
import createSpace from './create-space';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { entityType as storageEntityType } from 'oneprovider-gui/models/storage';
import sinon from 'sinon';

export default class FilePermissionsHelper {
  /**
   * @param {Mocha.Context} context
   */
  constructor(context) {
    this.context = context;
    this.store = lookupService(this.context, 'store');
    this.viewModelOptions = {};
  }
  async createFile(properties = {}) {
    return await this.store.createRecord('file', {
      name: 'dummy file',
      type: 'file',
      ...properties,
    }).save();
  }
  async createSpace(data) {
    return await createSpace(this.store, data);
  }
  async createViewModel() {
    if (!this.files) {
      throw new Error('files in helper not implemented');
    }
    if (!this.space) {
      throw new Error('space in helper not implemented');
    }
    return FileDistributionViewModel.create({
      ownerSource: this.context.owner,
      space: this.space,
      files: this.files,
      ...this.viewModelOptions,
    });
  }
  async beforeRender() {
    this.context.setProperties({
      viewModel: await this.createViewModel(),
    });
  }
  async renderBody() {
    await this.beforeRender();
    await this.context.render(hbs`
      {{file-distribution/body
        viewModel=viewModel
      }}
    `);
  }
  async renderAll() {
    await this.beforeRender();
    await this.context.render(hbs`
      {{file-permissions/body
        viewModel=viewModel
      }}
    `);
  }
  get bodySelector() {
    return '.file-distribution-body';
  }
  getBody() {
    return find(this.bodySelector);
  }
  getOneprovidersDistribution() {
    return this.getBody().querySelector('.oneproviders-distribution');
  }

  async createProvider(entityId, data) {
    const id = gri({
      entityType: providerEntityType,
      entityId,
      aspect: 'instance',
    });
    return await this.store.createRecord('provider', {
      id,
      ...data,
    }).save();
  }
  async createStorage(entityId, data) {
    const id = gri({
      entityType: storageEntityType,
      entityId,
      aspect: 'instance',
      scope: 'shared',
    });
    console.log('id', id, storageEntityType);
    return await this.store.createRecord('storage', {
      id,
      ...data,
    }).save();
  }
  async givenSingleFile(data) {
    this.files = [
      await this.createFile(data),
    ];
  }
  async givenSpace(data) {
    this.space = await this.createSpace(data);
    return this.space;
  }
  async givenSingleFileWithDistribution(data) {
    const krakow = await this.createProvider('krakow_id', {
      name: 'Kraków',
      online: true,
    });
    const paris = await this.createProvider('paris_id', {
      name: 'Paris',
      online: true,
    });
    await this.createStorage('krakow_storage_id', {
      name: 'krakow storage',
      provider: krakow,
    });
    await this.createStorage('paris_storage_id', {
      name: 'paris storage',
      provider: paris,
    });
    const emptyStorageDistribution = {
      physicalSize: 0,
      chunksBarData: {},
      blocksPercentage: 0,
      blockCount: 0,
    };
    const distribution = await this.store.createRecord('file-distribution', {
      distributionPerProvider: {
        krakow_id: {
          logicalSize: 100,
          success: true,
          distributionPerStorage: {
            krakow_storage_id: { ...emptyStorageDistribution },
          },
        },
        paris_id: {
          logicalSize: 100,
          success: true,
          distributionPerStorage: {
            paris_storage_id: { ...emptyStorageDistribution },
          },
        },
      },
    }).save();
    const providerList = await this.store.createRecord('provider-list', {
      list: [krakow, paris],
    }).save();
    const space = await this.givenSpace({
      name: 'space for file distribution',
      providerList,
    });
    console.log('space', await space.get('providerList'));
    return await this.givenSingleFile({
      distribution,
      ...data,
    });
  }
  givenNoTransfersForFile(file) {
    const transferManager = lookupService(this.context, 'transferManager');
    sinon.stub(transferManager, 'getTransfersForFile')
      .withArgs(file)
      .resolves({
        ongoingIds: [],
        endedCount: 0,
        endedIds: [],
      });
  }
  async givenNoTransfersForSingleFile() {
    return this.givenNoTransfersForFile(this.files[0]);
  }
}
