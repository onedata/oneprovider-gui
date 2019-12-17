import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import Service from '@ember/service';
import { registerService, lookupService } from '../../helpers/stub-service';
import wait from 'ember-test-helpers/wait';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';

const {
  stub,
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

describe('Integration | Component | space transfers', function () {
  setupComponentTest('space-transfers', {
    integration: true,
  });

  beforeEach(function () {
    const spaceId = 'dummySpaceId';
    const providerId = 'dummyProviderId';
    const provider = {
      entityId: providerId,
    };
    const providers = [provider];
    const resetQueryParams = sinon.spy();
    const changeListTab = sinon.spy();
    const closeFileTab = sinon.spy();
    this.on('resetQueryParams', resetQueryParams);
    this.on('changeListTab', changeListTab);
    this.on('closeFileTab', closeFileTab);
    const space = {
      entityId: spaceId,
      entityType: 'op_space',
      providerList: promiseObject(resolve({
        list: promiseArray(resolve(providers)),
      })),
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

  it('does not call getTransfersForFile if fileId is not injected', function () {
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

    this.render(hbs `<div id="content-scroll">{{space-transfers
      space=space
      fileId=undefined
      defaultTab=defaultTab
      providerId=providerId
      resetQueryParams=(action "resetQueryParams")
      changeListTab=(action "changeListTab")
      closeFileTab=(action "closeFileTab")
    }}</div>`);

    return wait().then(() => {
      expect(getTransfersForFile).to.have.not.been.called;
    });
  });

  it('calls getTransfersForFile if fileId is injected', function () {
    const fileId = this.get('fileId');
    const file = {
      entityId: fileId,
      name: 'Dummy file name',
    };
    const transferManager = this.get('transferManager');
    const store = this.get('store');
    const getTransfersForFile =
      stub(transferManager, 'getTransfersForFile').resolves({
        ongoingIds: [],
        endedIds: [],
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
    this.set('defaultTab', 'file');

    this.render(hbs `<div id="content-scroll">{{space-transfers
      space=space
      fileId=fileId
      defaultTab=defaultTab
      providerId=providerId
      resetQueryParams=(action "resetQueryParams")
      changeListTab=(action "changeListTab")
      closeFileTab=(action "closeFileTab")
    }}</div>`);

    return wait()
      .then(() => {
        expect(this.$('.row-transfers-tables'), '.row-transfers-tables').to
          .exist;
        expect(findRecord).to.have.been.calledOnce;
        expect(findRecord).to.have.been.calledWith('file', expectedFileGri);
        expect(getTransfersForFile).to.have.been.calledOnce;
        expect(getTransfersForFile).to.have.been.calledWith(file, true);
      });
  });

  it('does not render tab link for file tab if fileId is not provided',
    function () {
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
      findRecord.withArgs('file', `op_file.${fileId}.instance:private`)
        .resolves(file);

      this.render(hbs `<div id="content-scroll">{{space-transfers
        space=space
        defaultTab=defaultTab
        providerId=providerId
        resetQueryParams=(action "resetQueryParams")
        changeListTab=(action "changeListTab")
        closeFileTab=(action "closeFileTab")
      }}</div>`);

      return wait()
        .then(() => {
          expect(this.$('.nav-link-file'), '.nav-link-file').to.not.exist;
        });
    });

  it('renders tab link for file tab with file name if fileId is provided',
    function () {
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

      this.render(hbs `<div id="content-scroll">{{space-transfers
        space=space
        defaultTab=defaultTab
        fileId=fileId
        providerId=providerId
        resetQueryParams=(action "resetQueryParams")
        changeListTab=(action "changeListTab")
        closeFileTab=(action "closeFileTab")
      }}</div>`);

      return wait()
        .then(() => {
          const navLinkFile = this.$('.nav-link-file');
          expect(navLinkFile, '.nav-link-file').to.exist;
          expect(navLinkFile.text()).to.match(new RegExp(file.name));
        });
    });
});
