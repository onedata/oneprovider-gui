import { expect } from 'chai';
import { describe, it, context, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { click } from 'ember-native-dom-helpers';
import wait from 'ember-test-helpers/wait';
import { selectChoose } from '../../../helpers/ember-power-select';
import $ from 'jquery';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';

const urlTypeTranslations = {
  share: 'Public share link',
  handle: 'Public handle link',
  rest: 'REST API URL',
};

const shareUrl = 'http://share-url';
const handleUrl = 'http://handle-url';
const restUrl = 'http://rest-url';

describe('Integration | Component | share show/public url viewer', function () {
  setupComponentTest('share-show/public-url-viewer', {
    integration: true,
  });

  beforeEach(function () {
    const share = {
      publicUrl: shareUrl,
      restUrl,
      handle: promiseObject(resolve({
        url: handleUrl,
      })),
    };

    this.setProperties({
      share,
      selectedUrlType: 'share',
    });
  });

  testClipboardInput('share', testCase => testCase.get('share.publicUrl'));
  testClipboardInput('handle', testCase => testCase.get('share.handle.url'));
  testClipboardInput('rest', testCase => testCase.get('share.restUrl'));

  testChangeSelectedUrlTypePowerSelect('share');
  testChangeSelectedUrlTypePowerSelect('handle');
  testChangeSelectedUrlTypePowerSelect('rest');

  // FIXME: VFS-7293 if there is no proxy (eg. unavail) then do not display handle in menu
  // and do not allow to select it (regular user case)

  // FIXME: VFS-7293 test click on handle name and content of popover in desktop

  // FIXME: VFS-7293 test click on (i) in compact modes for all types
  // FIXME: VFS-7293 test click on (i) in desktop mode (except for naame in handle)

  context('in compact mode', function () {
    beforeEach(function () {
      this.setProperties({
        compact: true,
      });
    });

    testClipboardInput('share', testCase => testCase.get('share.publicUrl'));
    testClipboardInput('handle', testCase => testCase.get('share.handle.url'));
    testClipboardInput('rest', testCase => testCase.get('share.restUrl'));

    context('with showHandle', function () {
      beforeEach(function () {
        this.setProperties({
          showHandle: true,
        });
      });

      testChangeSelectedUrlTypeCompact('share');
      testChangeSelectedUrlTypeCompact('handle');
      testChangeSelectedUrlTypeCompact('rest');

      it('renders share and rest url options in selector', async function () {
        render(this);

        await click('.url-type-selector-trigger');

        const $options = $('.compact-url-type-selector-actions li');
        expect($options).to.have.length(3);
        expect($options.eq(0).text()).to.contain(urlTypeTranslations['share']);
        expect($options.eq(1).text()).to.contain(urlTypeTranslations['handle']);
        expect($options.eq(2).text()).to.contain(urlTypeTranslations['rest']);
      });
    });

    context('without showHandle', function () {
      beforeEach(function () {
        this.setProperties({
          showHandle: false,
        });
      });

      testChangeSelectedUrlTypeCompact('share');
      testChangeSelectedUrlTypeCompact('rest');

      it('renders handle, share and rest url options in selector', async function () {
        render(this);

        await click('.url-type-selector-trigger');

        const $options = $('.compact-url-type-selector-actions li');
        expect($options).to.have.length(2);
        expect($options.eq(0).text()).to.contain(urlTypeTranslations['share']);
        expect($options.eq(1).text()).to.contain(urlTypeTranslations['rest']);
      });
    });
  });
});

function testClipboardInput(type, evaluateValue) {
  it(`renders ${type} url in clipboard line if ${type} type is selected`, async function () {
    this.set('selectedUrlType', type);

    render(this);
    await wait();

    const $input = this.$('.clipboard-line-public-url-input');
    expect($input).to.exist;
    expect($input.val()).to.equal(evaluateValue(this));
  });
}

function testChangeSelectedUrlTypeCompact(type) {
  it(`changes selectedUrlType to ${type} after selecting if from compact selector`, async function () {
    render(this);
    await click('.url-type-selector-trigger');
    await click(`.option-${type}-link`);

    expect(this.$(`.public-url-viewer-${type}`)).to.exist;
  });
}

function testChangeSelectedUrlTypePowerSelect(type) {
  it(`changes selectedUrlType to ${type} after selecting if from selector`, async function () {
    render(this);
    await selectChoose('.col-key', urlTypeTranslations[type]);

    expect(this.$(`.public-url-viewer-${type}`)).to.exist;
  });
}

function render(testCase) {
  testCase.render(hbs `{{share-show/public-url-viewer
    share=share
    compact=compact
    showHandle=showHandle
    selectedUrlType=selectedUrlType
    changeSelectedUrlType=(action (mut selectedUrlType))
  }}`);
}
