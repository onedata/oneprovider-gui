import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import Service from '@ember/service';
import { registerService, lookupService } from '../../helpers/stub-service';

const Store = Service.extend({
  findRecord() {},
});

const TransferManager = Service.extend({
  getTransfersForSpace() {},
});

describe('Integration | Component | content space transfers', function () {
  setupComponentTest('content-space-transfers', {
    integration: true,
  });

  beforeEach(function beforeEach() {
    registerService(this, 'store', Store);
    registerService(this, 'transferManager', TransferManager);
  });

  it('renders in an iframe', function () {
    const spaceEntityId = 'seid';
    const space = {};
    const store = lookupService(this, 'store');
    const transferManager = lookupService(this, 'transferManager');
    sinon.stub(store, 'findRecord')
      .withArgs('space', sinon.match(new RegExp(spaceEntityId)))
      .resolves(space);
    sinon.stub(transferManager, 'getTransfersForSpace')
      .resolves([]);
    const callParent = sinon.spy();
    const frameElement = {
      appProxy: {
        callParent,
        propertyChanged: () => {},
        data: {
          spaceEntityId,
          parentInfo: {},
        },
      },
    };
    frameElement.spaceEntityId = 'space-entity-id';
    this.set('frameElement', frameElement);
    this.render(hbs `{{content-space-transfers
      frameElement=frameElement
    }}`);
    expect(this.$()).to.exist;
  });
});
