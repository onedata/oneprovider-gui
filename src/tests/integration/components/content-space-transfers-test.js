import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

describe('Integration | Component | content space transfers', function () {
  setupComponentTest('content-space-transfers', {
    integration: true,
  });

  it('renders in an iframe', function () {
    const callParent = sinon.spy();
    const frameElement = {
      appProxy: {
        callParent,
        propertyChanged: () => {},
        data: {
          iprop: 'hello',
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
