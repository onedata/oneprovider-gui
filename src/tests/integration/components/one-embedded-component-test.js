import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';
import { next } from '@ember/runloop';
import { lookupService } from '../../helpers/stub-service';
import { set } from '@ember/object';

describe('Integration | Component | one-embedded-component', function () {
  setupRenderingTest();

  it('exposes updated injected properties', async function () {
    const callParent = sinon.spy();
    const appProxyService = lookupService(this, 'app-proxy');
    const _window = {
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
    };
    set(appProxyService, '_window', _window);

    this.set('_window', _window);
    await render(hbs `{{#one-embedded-component
      _window=_window
      iframeInjectedProperties=(array "iprop")
      as |component|
    }}
      value: <div id="iprop-val">{{component.iprop}}</div>
    {{/one-embedded-component}}`);

    next(() => {
      _window.frameElement.appProxy.data.iprop = 'world';
      _window.frameElement.appProxy.propertyChanged('iprop');
    });
    expect(find('#iprop-val')).to.contain.text('hello');
    await settled();
    expect(find('#iprop-val')).to.contain.text('world');
  });
});
