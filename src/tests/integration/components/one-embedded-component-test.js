import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';
import { next } from '@ember/runloop';
import globals from 'onedata-gui-common/utils/globals';

describe('Integration | Component | one-embedded-component', function () {
  setupRenderingTest();

  it('exposes updated injected properties', async function () {
    const callParent = sinon.spy();
    globals.mock('window', {
      frameElement: {
        appProxy: {
          callParent,
          propertyChanged: () => {},
          data: {
            iprop: 'hello',
            parentInfo: {},
          },
        },
      },
    });

    await render(hbs `{{#one-embedded-component
      iframeInjectedProperties=(array "iprop")
      as |component|
    }}
      value: <div id="iprop-val">{{component.iprop}}</div>
    {{/one-embedded-component}}`);

    next(() => {
      globals.window.frameElement.appProxy.data.iprop = 'world';
      globals.window.frameElement.appProxy.propertyChanged('iprop');
    });
    expect(find('#iprop-val')).to.contain.text('hello');
    await settled();
    expect(find('#iprop-val')).to.contain.text('world');
  });
});
