import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { next } from '@ember/runloop';
import wait from 'ember-test-helpers/wait';

describe('Integration | Component | one embedded component', function () {
  setupComponentTest('one-embedded-component', {
    integration: true,
  });

  it('exposes updated injected properties', function () {
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
    frameElement.iprop = 'hello';
    this.set('frameElement', frameElement);

    this.render(hbs `{{#one-embedded-component
      frameElement=frameElement
      iframeInjectedProperties=(array "iprop")
      as |component|
    }}
      value: <div id="iprop-val">{{component.iprop}}</div>
    {{/one-embedded-component}}`);

    next(() => {
      frameElement.appProxy.data.iprop = 'world';
      frameElement.appProxy.propertyChanged('iprop');
    });
    expect(this.$('#iprop-val')).to.contain('hello');
    return wait().then(() => {
      expect(this.$('#iprop-val')).to.contain('world');
    });
  });
});
