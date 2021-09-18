import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import Component from '@ember/component';
import InModalBrowserContainerBase from 'oneprovider-gui/mixins/in-modal-item-browser-container-base';

const DummyComponent = Component.extend(InModalBrowserContainerBase, {
  layout: hbs `{{yield contentScroll}}`,
});

describe('Integration | Mixin | in modal item browser container base', function () {
  setupComponentTest('in-modal-browser-container-base', {
    integration: true,
  });

  beforeEach(function () {
    this.register('component:dummy-component', DummyComponent);
  });

  it('adds contentScroll property that returns element selected with conentScrollSelector if provided',
    function () {
      const spy = sinon.spy();
      const callback = function (testCallbackComponent) {
        const cs = testCallbackComponent.get('contentScroll');
        expect(cs).to.be.instanceOf(HTMLDivElement);
        expect(cs.id).to.equal('dummy-scroll');
        spy(cs);
      };
      this.set('callback', callback);

      this.render(hbs `<div id="dummy-scroll">
        {{#dummy-component contentScrollSelector="#dummy-scroll" as |contentScroll|}}
          {{test-callback callback=callback contentScroll=contentScroll}}
        {{/dummy-component}}
      </div>`);

      expect(spy).to.be.calledOnce;
    }
  );

  it('adds contentScroll property that returns body if scroll selector is not provided and there is no bs-modal-body-scroll',
    function () {
      const spy = sinon.spy();
      const callback = function (testCallbackComponent) {
        const cs = testCallbackComponent.get('contentScroll');
        expect(cs).to.be.instanceOf(HTMLBodyElement);
        spy(cs);
      };
      this.set('callback', callback);

      this.render(hbs `<div id="dummy-scroll">
        {{#dummy-component as |contentScroll|}}
          {{test-callback callback=callback contentScroll=contentScroll}}
        {{/dummy-component}}
      </div>`);

      expect(spy).to.be.calledOnce;
    }
  );

  it('adds contentScroll property that returns bs-modal-body-scroll if it exists and no scroll selector is provided',
    function () {
      const spy = sinon.spy();
      const callback = function (testCallbackComponent) {
        const cs = testCallbackComponent.get('contentScroll');
        expect(cs.className.toString()).to.equal('bs-modal-body-scroll');
        spy(cs);
      };
      this.set('callback', callback);

      this.render(hbs `<div id="dummy-modal-body">
        <div div class = "bs-modal-body-scroll" >
          {{#dummy-component modalBodyId="dummy-modal-body" as |contentScroll|}}
            {{test-callback callback=callback contentScroll=contentScroll}}
          {{/dummy-component}}
        </div>
      </div>`);

      expect(spy).to.be.calledOnce;
    }
  );
});
