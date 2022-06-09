import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { next } from '@ember/runloop';
import wait from 'ember-test-helpers/wait';
import { lookupService } from '../../helpers/stub-service';
import { set } from '@ember/object';

describe('Integration | Component | one embedded component', function () {
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
    expect(this.$('#iprop-val')).to.contain('hello');
    return wait().then(() => {
      expect(this.$('#iprop-val')).to.contain('world');
    });
  });
});
