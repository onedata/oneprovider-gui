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
  rest: 'Public REST endpoint',
};

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
  testClipboardInput('rest', testCase =>
    `curl ${testCase.get('share.publicRestUrl')}`
  );

  testChangeSelectedUrlTypePowerSelect('share');
  testChangeSelectedUrlTypePowerSelect('rest');

  context('with showHandle', function () {
    beforeEach(function () {
      this.set('showHandle', true);
    });

    testClipboardInput('handle', testCase => testCase.get('share.handle.url'));
    testChangeSelectedUrlTypePowerSelect('handle');
    testShowsUrlTypeInformationInPopover('handle');

    it('renders only "share" and "rest" url options without "handle" in selector if handle rejects',
      async function (done) {
        this.setProperties({
          share: {
            publicUrl: shareUrl,
            publicRestUrl,
            handle: promiseObject(reject()),
          },
          selectedUrlType: 'handle',
        });

        await render(this);
        await clickTrigger('.col-key');

        const $options = $('li.ember-power-select-option');
        checkUrlTypeOptions($options, ['share', 'rest']);
        expect($('.public-url-viewer-share'), 'share mode fallback').to.exist;
        done();
      }
    );

    context('with rejected handle service', function () {
      beforeEach(function () {
        this.setProperties({
          share: {
            publicUrl: shareUrl,
            publicRestUrl,
            handle: promiseObject(resolve({
              url: handleUrl,
              entityId: handleId,
              handleService: promiseObject(reject()),
            })),
          },
          selectedUrlType: 'handle',
        });
      });

      it('renders "share", "handle" and "rest" url options in selector if handle resolves but handle service rejects',
        async function (done) {
          await render(this);
          await clickTrigger('.col-key');

          const $options = $('li.ember-power-select-option');
          checkUrlTypeOptions($options, ['share', 'handle', 'rest']);
          expect($('.public-url-viewer-handle'), 'handle mode').to.exist;
          done();
        }
      );

      testShowsUrlTypeInformationInPopover('handle', { rejectedHandleService: true });
    });

    it('can render handle service name',
      async function (done) {
        this.set('selectedUrlType', 'handle');

        await render(this);
        await wait();

        expect($('.input-handle-service-name'), 'handle service name').to.exist;
        expect($('.input-handle-service-name').text()).to.contain(handleService.name);
        done();
      }
    );

    it('does not render handle service name if handle service rejects',
      async function (done) {
        this.setProperties({
          share: {
            publicUrl: shareUrl,
            publicRestUrl,
            handle: promiseObject(resolve({
              url: handleUrl,
              entityId: handleId,
              handleService: promiseObject(reject()),
            })),
          },
          selectedUrlType: 'handle',
        });

        await render(this);
        await clickTrigger('.col-key');

        expect($('.input-handle-service-name'), 'handle service name').to.not.exist;
        expect($('.url-type-info-trigger.input-group-addon-icon .oneicon')).to.exist;
        done();
      }
    );
  });

  context('in compact mode', function () {
    beforeEach(function () {
      this.set('compact', true);
    });

    testShowsUrlTypeInformationInPopover('share');
    testShowsUrlTypeInformationInPopover('rest');

    testClipboardInput('share', testCase =>
      testCase.get('share.publicUrl')
    );
    testClipboardInput('rest', testCase =>
      `curl ${testCase.get('share.publicRestUrl')}`
    );

    context('with showHandle', function () {
      beforeEach(function () {
        this.set('showHandle', true);
      });

      testClipboardInput('handle', testCase =>
        testCase.get('share.handle.url')
      );

      testShowsUrlTypeInformationInPopover('handle');

      testChangeSelectedUrlTypeCompact('share');
      testChangeSelectedUrlTypeCompact('handle');
      testChangeSelectedUrlTypeCompact('rest');

      it('does not render handle service name, but only icon', async function (done) {
        this.set('selectedUrlType', 'handle');

        await render(this);
        await wait();

        expect($('.input-handle-service-name'), 'handle service name').to.not.exist;
        expect($('.url-type-info-trigger.input-group-addon-icon .oneicon')).to.exist;
        done();
      });

      it('renders handle, share and rest url options in selector', async function (done) {
        await render(this);

        await click('.url-type-selector-trigger');

        const $options = $('.compact-url-type-selector-actions li');
        checkUrlTypeOptions($options, ['share', 'handle', 'rest']);
        done();
      });

      it('renders only "share" and "rest" url options without "handle" in selector if handle rejects',
        async function (done) {
          this.set('share', {
            publicUrl: shareUrl,
            publicRestUrl,
            handle: promiseObject(reject()),
          });

          await render(this);
          await click('.url-type-selector-trigger');

          const $options = $('.compact-url-type-selector-actions li');
          checkUrlTypeOptions($options, ['share', 'rest']);
          expect($('.public-url-viewer-share')).to.exist;
          done();
        }
      );
    });

    context('without showHandle', function () {
      beforeEach(function () {
        this.set('showHandle', false);
      });

      testChangeSelectedUrlTypeCompact('share');
      testChangeSelectedUrlTypeCompact('rest');

      it('renders share and rest url options in selector', async function (done) {
        await render(this);

        await click('.url-type-selector-trigger');

        const $options = $('.compact-url-type-selector-actions li');
        checkUrlTypeOptions($options, ['share', 'rest']);
        done();
      });
    });
  });
});

function testClipboardInput(type, evaluateValue) {
  it(`renders ${type} url in clipboard line if ${type} type is selected`, async function (done) {
    this.set('selectedUrlType', type);

    await render(this);
    await wait();

    const $input = this.$('.clipboard-line-public-url-input');
    expect($input, 'clipboard-line-public-url-input').to.exist;
    expect($input.val()).to.equal(evaluateValue(this));
    done();
  });
}

function testChangeSelectedUrlTypeCompact(type) {
  it(`changes selectedUrlType to ${type} after selecting it from compact selector`, async function (done) {
    await render(this);
    await click('.url-type-selector-trigger');
    await click(`.option-${type}-link`);

    expect(this.$(`.public-url-viewer-${type}`), `.public-url-viewer-${type} (compact)`)
      .to.exist;
    done();
  });
}

function testChangeSelectedUrlTypePowerSelect(type) {
  it(`changes selectedUrlType to ${type} after selecting it from selector`, async function (done) {
    await render(this);
    await selectChoose('.col-key', urlTypeTranslations[type]);

    expect(this.$(`.public-url-viewer-${type}`), `.public-url-viewer-${type}`).to.exist;
    done();
  });
}

const urlTypeInfoChecks = {
  handle({ rejectedHandleService = false } = {}) {
    expect($('.handle-id-clipboard-line .clipboard-input'), 'handle clipboard');
    expect($('.handle-id-clipboard-line .clipboard-input').val()).to.equal(handleId);
    expect(
      $('.handle-service-id-clipboard-line .clipboard-input'),
      'handle service clipboard'
    ).to.have.length(rejectedHandleService ? 0 : 1);
    expect($('.handle-service-name')).to.have.length(rejectedHandleService ? 0 : 1);
    if (!rejectedHandleService) {
      expect($('.handle-service-id-clipboard-line .clipboard-input').val())
        .to.equal(handleService.entityId);
    }
  },
  share() {},
  rest() {},
};

function testShowsUrlTypeInformationInPopover(type, informationOptions = {}) {
  let suffix = '';
  if (informationOptions && Object.keys(informationOptions).length > 0) {
    suffix = `(${Object.keys(informationOptions).join(', ')})`;
  }
  it(`opens popover with information about "${type}" URL ${suffix}`, async function (done) {
    this.set('selectedUrlType', type);

    await render(this);
    await wait();
    await click('.url-type-info-trigger');

    expect($(`.url-type-info-content-${type}`), 'url-type-info-content').to.exist;
    expect($('.webui-popover-url-type-info.in'), 'webui-popover-url-type-info').to.exist;
    urlTypeInfoChecks[type](informationOptions);
    done();
  });
}

async function render(testCase) {
  testCase.render(hbs `{{share-show/public-url-viewer
    share=share
    compact=compact
    showHandle=showHandle
    selectedUrlType=selectedUrlType
    changeSelectedUrlType=(action (mut selectedUrlType))
  }}`);
  await wait();
}

function checkUrlTypeOptions($options, urlTypes) {
  expect($options).to.have.length(urlTypes.length);
  for (let i = 0; i < urlTypes.length; ++i) {
    expect($options.eq(i).text()).to.contain(urlTypeTranslations[urlTypes[i]]);
  }
}
