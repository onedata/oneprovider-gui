import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';
import Service from '@ember/service';
import { registerService, lookupService } from '../../helpers/stub-service';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';

const {
  stub,
  spy,
} = sinon;

const TransferManager = Service.extend({
  getTransfersForSpace: notImplementedReject,
  getTransfersForFile: notImplementedReject,
  getSpaceTransfersActiveChannels: notImplementedReject,
  getSpaceTransfersThroughputCharts: notImplementedReject,
});

const Store = Service.extend({
  findRecord: notImplementedReject,
});

const ErrorExtractor = Service.extend({
  getMessage: () => ({
    message: 'error extractor message',
  }),
});

describe('Integration | Component | space-transfers', function () {
  setupRenderingTest();

  beforeEach(function () {
    const spaceId = 'dummySpaceId';
    const providerId = 'dummyProviderId';
    const provider = {
      entityId: providerId,
    };
    const providers = [provider];
    const resetQueryParams = spy();
    const changeListTab = spy();
    const closeFileTab = spy();
    this.set('resetQueryParams', resetQueryParams);
    this.set('changeListTab', changeListTab);
    this.set('closeFileTab', closeFileTab);
    const providerListProxy = promiseObject(resolve({
      list: promiseArray(resolve(providers)),
    }));
    const space = {
      entityId: spaceId,
      entityType: 'op_space',
      providerList: providerListProxy,
      getRelation(name) {
        if (name === 'providerList') {
          return providerListProxy;
        }
      },
    };
    const fileId = 'dummyFileId';
    const defaultTab = 'waiting';
    registerService(this, 'transferManager', TransferManager);
    registerService(this, 'store', Store);
    registerService(this, 'errorExtractor', ErrorExtractor);
    this.setProperties({
      space,
      fileId,
      defaultTab,
      providerId,
      transferManager: lookupService(this, 'transferManager'),
      store: lookupService(this, 'store'),
      actions: {
        resetQueryParams,
        changeListTab,
        closeFileTab,
      },
    });
  });

  it('does not call getTransfersForFile if fileId is not injected', async function () {
    const transferManager = this.get('transferManager');
    const getTransfersForFile =
      stub(transferManager, 'getTransfersForFile').resolves([]);
    stub(transferManager, 'getTransfersForSpace').resolves([]);
    stub(transferManager, 'getSpaceTransfersActiveChannels').resolves({});
    stub(transferManager, 'getSpaceTransfersThroughputCharts').resolves({
      inputCharts: [],
      outputCharts: [],
      timestamp: 0,
    });

    await render(hbs `<div id="content-scroll">{{space-transfers
      space=space
      fileId=undefined
      defaultTab=defaultTab
      providerId=providerId
      resetQueryParams=(action resetQueryParams)
      changeListTab=(action changeListTab)
      closeFileTab=(action closeFileTab)
    }}</div>`);

    expect(getTransfersForFile).to.have.not.been.called;
  });

  it('calls getTransfersForFile if fileId is injected', async function () {
    const fileId = this.get('fileId');
    const file = {
      entityId: fileId,
      name: 'Dummy file name',
    };
    const transferManager = this.get('transferManager');
    const store = this.get('store');
    const getTransfersForFile =
      stub(transferManager, 'getTransfersForFile').resolves({
        ongoingTransfers: [],
        endedTransfers: [],
        endedCount: 0,
      });
    stub(transferManager, 'getTransfersForSpace').resolves([]);
    stub(transferManager, 'getSpaceTransfersActiveChannels').resolves({});
    stub(transferManager, 'getSpaceTransfersThroughputCharts').resolves({
      inputCharts: [],
      outputCharts: [],
      timestamp: 0,
    });
    const findRecord = stub(store, 'findRecord');
    const expectedFileGri = `file.${fileId}.instance:private`;
    findRecord.withArgs('file', expectedFileGri).resolves(file);
    this.set('tab', 'file');

    await render(hbs `<div id="content-scroll">{{space-transfers
      space=space
      fileId=fileId
      tab=tab
      providerId=providerId
      resetQueryParams=(action resetQueryParams)
      changeListTab=(action changeListTab)
      closeFileTab=(action closeFileTab)
    }}</div>`);

    expect(find('.row-transfers-tables'), '.row-transfers-tables').to
      .exist;
    expect(findRecord).to.have.been.calledOnce;
    expect(findRecord).to.have.been.calledWith('file', expectedFileGri);
    expect(getTransfersForFile).to.have.been.calledWith(file, true);
  });

  it('does not render tab link for file tab if fileId is not provided',
    async function () {
      const fileId = this.get('fileId');
      const file = {
        entityId: fileId,
        name: 'Dummy file name',
      };
      const transferManager = this.get('transferManager');
      const store = this.get('store');
      stub(transferManager, 'getTransfersForFile').resolves([]);
      stub(transferManager, 'getTransfersForSpace').resolves([]);
      stub(transferManager, 'getSpaceTransfersActiveChannels').resolves({});
      stub(transferManager, 'getSpaceTransfersThroughputCharts').resolves({
        inputCharts: [],
        outputCharts: [],
        timestamp: 0,
      });
      const findRecord = stub(store, 'findRecord');
      findRecord.withArgs('file', `file.${fileId}.instance:private`)
        .resolves(file);

      await render(hbs `<div id="content-scroll">{{space-transfers
        space=space
        defaultTab=defaultTab
        providerId=providerId
        resetQueryParams=(action resetQueryParams)
        changeListTab=(action changeListTab)
        closeFileTab=(action closeFileTab)
      }}</div>`);

      expect(find('.nav-link-file'), '.nav-link-file').to.not.exist;
    });

  it('renders tab link for file tab with file name if fileId is provided',
    async function () {
      const fileId = this.get('fileId');
      const file = {
        entityId: fileId,
        name: 'Dummy file name',
      };
      const transferManager = this.get('transferManager');
      const store = this.get('store');
      stub(transferManager, 'getTransfersForFile').resolves([]);
      stub(transferManager, 'getTransfersForSpace').resolves([]);
      stub(transferManager, 'getSpaceTransfersActiveChannels').resolves({});
      stub(transferManager, 'getSpaceTransfersThroughputCharts').resolves({
        inputCharts: [],
        outputCharts: [],
        timestamp: 0,
      });
      const findRecord = stub(store, 'findRecord');
      findRecord.withArgs('file', `file.${fileId}.instance:private`)
        .resolves(file);

      await render(hbs `<div id="content-scroll">{{space-transfers
        space=space
        defaultTab=defaultTab
        fileId=fileId
        providerId=providerId
        resetQueryParams=(action resetQueryParams)
        changeListTab=(action changeListTab)
        closeFileTab=(action closeFileTab)
      }}</div>`);

      const navLinkFile = find('.nav-link-file');
      expect(navLinkFile, '.nav-link-file').to.exist;
      expect(navLinkFile).to.have.trimmed.text(file.name);
    });
});
