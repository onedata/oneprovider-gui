import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import { get } from '@ember/object';
import tHelper from 'ember-i18n/helper';
import localeConfig from 'ember-i18n/config/en';
import { getOwner } from '@ember/application';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';

const shareUrl = 'http://share-url';
const handleUrl = 'http://handle-url';
const publicRestUrl = 'http://rest-url';

const handleId = 'handle_id';

const handleService = {
  name: 'Handle serice name',
  entityId: 'handle_service_id',
};

const share = {
  publicUrl: shareUrl,
  publicRestUrl,
  handle: promiseObject(resolve({
    url: handleUrl,
    entityId: handleId,
    handleService: promiseObject(resolve(handleService)),
  })),
};

const defaultUrlType = 'share';

describe('Unit | Component | share show/public url viewer', function () {
  setupComponentTest('share-show/public-url-viewer', {
    needs: [
      'service:i18n',
      'service:rest-api-generator',
      'locale:en/translations',
      'util:i18n/missing-message',
      'util:i18n/compile-template',
      'service:scroll-state',
      'service:media',
      'service:global-notify',
      'component:spin-spinner-block',
      'component:spin-spinner',
      'component:loading-container',
      'component:one-dropdown',
      'component:one-copy-button',
      'component:copy-button',
      'component:one-icon',
      'component:power-select',
      'component:power-select/trigger',
      'component:power-select/placeholder',
      'component:one-webui-popover',
      'component:click-outside',
      'component:basic-dropdown',
      'component:basic-dropdown/trigger',
      'component:basic-dropdown/content',
      'component:one-clipboard-line',
      'component:one-tooltip',
      'component:share-show/url-info-share',
      'component:share-show/url-info-handle',
      'component:share-show/url-info-rest',
      'helper:array',
      'helper:and',
      'helper:not',
      'helper:eq',
      'helper:tt',
      'helper:concat-classes',
      'config:environment',
    ],
    unit: true,
  });

  beforeEach(function () {
    getOwner(this).lookup('service:i18n').set('locale', 'en');
    this.register('locale:en/config', localeConfig);
    this.register('helper:t', tHelper);
  });

  ['share', 'handle', 'rest'].forEach(selectedUrlType => {
    it(`sets effSelectedUrlType to "${selectedUrlType}" for "${selectedUrlType}" selectedUrlType`, function () {
      const component = this.subject({
        selectedUrlType,
        showHandle: true,
        share,
      });
      this.render();
      expect(get(component, 'effSelectedUrlType')).to.equal(selectedUrlType);
    });
  });

  it('sets effSelectedUrlType to default for "handle" selectedUrlType and no handle data beside of showHandle',
    function () {
      const component = this.subject({
        selectedUrlType: 'handle',
        showHandle: true,
        share: {
          name: 'Share name',
          entityId: 'share_id',
        },
      });
      this.render();
      expect(get(component, 'effSelectedUrlType')).to.equal('share');
    }
  );

  it('sets effSelectedUrlType to default for "handle" selectedUrlType and showHandle beside of valid handle data',
    function () {
      const component = this.subject({
        selectedUrlType: 'handle',
        showHandle: false,
        share,
      });
      this.render();
      expect(get(component, 'effSelectedUrlType')).to.equal(defaultUrlType);
    }
  );

  it('fallbacks effSelectedUrlType to default for non-defined selectedUrlType', function () {
    const component = this.subject({
      selectedUrlType: 'hello',
    });
    this.render();
    expect(get(component, 'effSelectedUrlType')).to.equal(defaultUrlType);
  });
});
