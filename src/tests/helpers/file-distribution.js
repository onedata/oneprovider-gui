import { hbs } from 'ember-cli-htmlbars';
import { find } from '@ember/test-helpers';
import FileDistributionViewModel from 'oneprovider-gui/utils/file-distribution-view-model';
import { lookupService } from './stub-service';
import createSpace from './create-space';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { entityType as storageEntityType } from 'oneprovider-gui/models/storage';
import sinon from 'sinon';
import { all as allFulfilled } from 'rsvp';

export default class FileDistributionHelper {
  /**
   * @param {Mocha.Context} context
   */
  constructor(context) {
    this.context = context;
    this.store = lookupService(this.context, 'store');
    this.viewModelOptions = {};
    /** @type {Models.File} */
    this.file = null;
    /** @type {Models.Space} */
    this.space = null;
    /** @type {Array<Models.Storage>} */
    this.storages = [];
    /** @type {Array<Models.Provider>} */
    this.providers = [];
    /** @type {Models.FileDistribution} */
    this.distribution = null;
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
  get bodySelector() {
    return '.file-distribution-body';
  }
  getBody() {
    return find(this.bodySelector);
  }
  getOneprovidersDistribution() {
    return this.getBody().querySelector('.oneproviders-distribution');
  }
  getOneproviderDistributionItem(oneproviderId) {
    return this.getOneprovidersDistribution()
      .querySelector(`.oneproviders-distribution-item.oneprovider-${oneproviderId}`);
  }
  getTransferManager() {
    return lookupService(this.context, 'transferManager');
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
    this.space = await this.createSpace({
      currentUserEffPrivileges: [
        'space_schedule_replication',
      ],
      ...data,
    });
    return this.space;
  }
  async givenSingleFileWithDistribution(data) {
    const providers = await allFulfilled([
      this.createProvider('krakow_id', {
        name: 'Kraków',
        online: true,
      }),
      this.createProvider('paris_id', {
        name: 'Paris',
        online: true,
      }),
    ]);
    this.providers = providers;
    const [krakow, paris] = providers;
    const storages = await allFulfilled([
      this.createStorage('krakow_storage_id', {
        name: 'krakow storage',
        provider: krakow,
      }),
      this.createStorage('paris_storage_id', {
        name: 'paris storage',
        provider: paris,
      }),
    ]);
    this.storages = storages;
    const fullStorageDistribution = {
      physicalSize: 100,
      chunksBarData: { 0: 100 },
      blocksPercentage: 100,
      blockCount: 1,
    };
    const emptyStorageDistribution = {
      physicalSize: 0,
      chunksBarData: {},
      blocksPercentage: 0,
      blockCount: 0,
    };
    const distribution = await this.store.createRecord('file-distribution', {
      distributionPerProvider: {
        krakow_id: {
          virtualSize: 100,
          success: true,
          distributionPerStorage: {
            krakow_storage_id: { ...fullStorageDistribution },
          },
        },
        paris_id: {
          virtualSize: 100,
          success: true,
          distributionPerStorage: {
            paris_storage_id: { ...emptyStorageDistribution },
          },
        },
      },
    }).save();
    this.distribution = distribution;
    const providerList = await this.store.createRecord('provider-list', {
      list: [krakow, paris],
    }).save();
    await this.givenSpace({
      name: 'space for file distribution',
      providerList,
    });
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
