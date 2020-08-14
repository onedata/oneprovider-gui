import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import Service from '@ember/service';
import { registerService, lookupService } from '../../helpers/stub-service';
import wait from 'ember-test-helpers/wait';
import { resolve } from 'rsvp';
import { set } from '@ember/object';

const Store = Service.extend({
  findRecord() {},
});

const TransferManager = Service.extend({
  getTransfersForSpace() {},
  getSpaceTransfersActiveChannels() {},
  getSpaceTransfersThroughputCharts() {},
});

const GuiContext = Service.extend({});

describe('Integration | Component | content space transfers', function () {
  setupComponentTest('content-space-transfers', {
    integration: true,
  });

  beforeEach(function beforeEach() {
    registerService(this, 'store', Store);
    registerService(this, 'transferManager', TransferManager);
    registerService(this, 'guiContext', GuiContext);
  });

  it('renders with internal components and transfer row in an iframe', function () {
    const spaceEntityId = 'seid';
    const transfersActiveChannels = {};
    const provider1 = {
      entityId: 'p1',
      name: 'Provider One',
    };
    const provider2 = {
      entityId: 'p2',
      name: 'Provider Two',
    };
    const providerListPromise = resolve({
      list: resolve([
        provider1,
        provider2,
      ]),
    });
    const space = {
      updateTransfersActiveChannelsProxy: resolve(
        transfersActiveChannels
      ),
      providerList: providerListPromise,
      getRelation(name) {
        if (name === 'providerList') {
          return providerListPromise;
        } else {
          throw new Error('not mocked');
        }
      },
    };
    const store = lookupService(this, 'store');
    const transferManager = lookupService(this, 'transferManager');
    const guiContext = lookupService(this, 'guiContext');
    const appProxy = lookupService(this, 'app-proxy');
    sinon.stub(store, 'findRecord')
      .rejects()
      .withArgs('space', sinon.match(new RegExp(spaceEntityId)))
      .resolves(space);
    sinon.stub(transferManager, 'getTransfersForSpace')
      .resolves([{
        entityId: '3281239312ip232813',
        isOngoing: false,
        dataSourceName: '/onefile',
        dataSourceType: 'file',
        dataSourceId: 'f1',
        userId: 'u1',
        queryParams: {},
        scheduleTime: 1,
        fetchUser: () => resolve({}),
      }]);
    sinon.stub(transferManager, 'getSpaceTransfersActiveChannels')
      .resolves({
        channelDestinations: {},
      });
    sinon.stub(transferManager, 'getSpaceTransfersThroughputCharts')
      .resolves({
        inputCharts: {},
        outputCharts: {},
        timestamp: 0,
      });
    guiContext.clusterId = provider1.entityId;
    const callParent = sinon.spy();
    const _window = {
      frameElement: {
        appProxy: {
          callParent,
          propertyChanged: () => {},
          data: {
            spaceEntityId,
            parentInfo: {},
          },
        },
      },
    };

    set(appProxy, '_window', _window);
    this.set('_window', _window);
    this.render(hbs `
      <div id="content-scroll">
        {{content-space-transfers _window=_window}}
      </div>
    `);

    return wait()
      .then(() => {
        expect(this.$()).to.exist;
        expect(this.$('.space-transfers'), 'space-transfers').to.exist;
        expect(this.$('.transfers-overview'), 'transfers-overview').to.exist;
        expect(this.$('.tables-container'), 'tables-container').to.exist;
        expect(this.$('.providers-map'), 'providers-map').to.exist;
        expect(this.$('.transfers-table').text(), 'transfers-table')
          .to.contain('onefile');
      });
  });
});
