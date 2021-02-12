import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import { get } from '@ember/object';
import tHelper from 'ember-i18n/helper';
import localeConfig from 'ember-i18n/config/en';
import { getOwner } from '@ember/application';

describe('Unit | Component | share show/public url viewer', function () {
  setupComponentTest('share-show/public-url-viewer', {
    needs: [
      'service:i18n',
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
      'component:basic-dropdown',
      'component:basic-dropdown/trigger',
      'component:basic-dropdown/content',
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
    // set the locale and the config
    getOwner(this).lookup('service:i18n').set('locale', 'en');
    this.register('locale:en/config', localeConfig);

    // register t helper
    this.register('helper:t', tHelper);
  });

  ['share', 'handle', 'rest'].forEach(selectedUrlType => {
    it(`sets effSelectedUrlType to "${selectedUrlType}" selectedUrlType`, function () {
      const component = this.subject({
        selectedUrlType,
      });
      this.render();
      expect(get(component, 'effSelectedUrlType')).to.equal(selectedUrlType);
      expect(this.$()).to.have.length(1);
    });
  });

  it('fallbacks effSelectedUrlType to default for non-defined selectedUrlType', function () {
    const component = this.subject({
      selectedUrlType: 'hello',
    });
    this.render();
    expect(get(component, 'effSelectedUrlType')).to.equal('share');
    expect(this.$()).to.have.length(1);
  });
});
