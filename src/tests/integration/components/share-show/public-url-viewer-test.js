import { expect } from 'chai';
import { describe, it, context, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { click } from 'ember-native-dom-helpers';
import wait from 'ember-test-helpers/wait';
import { selectChoose, clickTrigger } from '../../../helpers/ember-power-select';
import $ from 'jquery';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve, reject } from 'rsvp';

const urlTypeTranslations = {
  share: 'Public share link',
  handle: 'Public handle link',
  rest: 'REST API URL',
};

const shareUrl = 'http://share-url';
const handleUrl = 'http://handle-url';
const restUrl = 'http://rest-url';

const handleId = 'handle_id';

const handleService = {
  name: 'Handle serice name',
  entityId: 'handle_service_id',
};

const share = {
  publicUrl: shareUrl,
  restUrl,
  handle: promiseObject(resolve({
    url: handleUrl,
    entityId: handleId,
    handleService: promiseObject(resolve(handleService)),
  })),
};

describe('Integration | Component | share show/public url viewer', function () {
  setupComponentTest('share-show/public-url-viewer', {
    integration: true,
  });

  beforeEach(function () {
    this.setProperties({
      share,
      selectedUrlType: 'share',
    });
  });

  testShowsUrlTypeInformationInPopover('share');
  testShowsUrlTypeInformationInPopover('rest');

  testClipboardInput('share', testCase => testCase.get('share.publicUrl'));
  testClipboardInput('rest', testCase => testCase.get('share.restUrl'));

  testChangeSelectedUrlTypePowerSelect('share');
  testChangeSelectedUrlTypePowerSelect('rest');

  it('renders only "share" and "rest" url options without "handle" in selector if handle rejects',
    async function () {
      this.setProperties({
        share: {
          publicUrl: shareUrl,
          restUrl,
          handle: promiseObject(reject()),
        },
        selectedUrlType: 'handle',
      });

      render(this);
      await clickTrigger('.col-key');

      const $options = $('li.ember-power-select-option');
      expect($options).to.have.length(2);
      expect($options.eq(0).text()).to.contain(urlTypeTranslations['share']);
      expect($options.eq(1).text()).to.contain(urlTypeTranslations['rest']);
      expect($('.public-url-viewer-share')).to.exist;
    }
  );

  context('with showHandle', function () {
    beforeEach(function () {
      this.setProperties({
        showHandle: true,
      });
    });

    testClipboardInput('handle', testCase => testCase.get('share.handle.url'));
    testChangeSelectedUrlTypePowerSelect('handle');
    testShowsUrlTypeInformationInPopover('handle');
  });

  context('in compact mode', function () {
    beforeEach(function () {
      this.setProperties({
        compact: true,
      });
    });

    testShowsUrlTypeInformationInPopover('share');
    testShowsUrlTypeInformationInPopover('rest');

    testClipboardInput('share', testCase => testCase.get('share.publicUrl'));
    testClipboardInput('rest', testCase => testCase.get('share.restUrl'));

    context('with showHandle', function () {
      beforeEach(function () {
        this.setProperties({
          showHandle: true,
        });
      });

      testClipboardInput('handle', testCase => testCase.get('share.handle.url'));

      testShowsUrlTypeInformationInPopover('handle');

      testChangeSelectedUrlTypeCompact('share');
      testChangeSelectedUrlTypeCompact('handle');
      testChangeSelectedUrlTypeCompact('rest');

      it('does not render handle service name, but only icon', async function () {
        this.setProperties({
          selectedUrlType: 'handle',
        });

        render(this);
        await wait();

        expect($('.input-handle-service-name')).to.not.exist;
      });

      it('renders share and rest url options in selector', async function () {
        render(this);

        await click('.url-type-selector-trigger');

        const $options = $('.compact-url-type-selector-actions li');
        expect($options).to.have.length(3);
        expect($options.eq(0).text()).to.contain(urlTypeTranslations['share']);
        expect($options.eq(1).text()).to.contain(urlTypeTranslations['handle']);
        expect($options.eq(2).text()).to.contain(urlTypeTranslations['rest']);
      });

      it('renders only "share" and "rest" url options without "handle" in selector if handle rejects',
        async function () {
          this.set('share', {
            publicUrl: shareUrl,
            restUrl,
            handle: promiseObject(reject()),
          });

          render(this);
          await click('.url-type-selector-trigger');

          const $options = $('.compact-url-type-selector-actions li');
          expect($options).to.have.length(2);
          expect($options.eq(0).text()).to.contain(urlTypeTranslations['share']);
          expect($options.eq(1).text()).to.contain(urlTypeTranslations['rest']);
          expect($('public-url-viewer-share')).to.exist;
        }
      );
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

const urlTypeInfoChecks = {
  handle() {
    expect($('.handle-id-clipboard-line .clipboard-input')).to.exist;
    expect($('.handle-service-id-clipboard-line .clipboard-input')).to.exist;
    expect($('.handle-id-clipboard-line .clipboard-input').val())
      .to.equal(handleId);
    expect($('.handle-service-id-clipboard-line .clipboard-input').val())
      .to.equal(handleService.entityId);
  },
  share() {},
  rest() {},
};

function testShowsUrlTypeInformationInPopover(type) {
  it(`opens popover with information about "${type}" URL`, async function () {
    this.setProperties({
      selectedUrlType: type,
    });

    render(this);
    await wait();
    await click('.url-type-info-trigger');

    expect($(`.url-type-info-content-${type}`)).to.exist;
    expect($('.webui-popover-url-type-info.in')).to.exist;
    urlTypeInfoChecks[type]();
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
