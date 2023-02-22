import { expect } from 'chai';
import { describe, it, context, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { clickTrigger, selectChoose } from 'ember-power-select/test-support/helpers';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve, reject } from 'rsvp';
import { get } from '@ember/object';

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

const defaultUrlType = 'share';

describe('Integration | Component | share show/public url viewer', function () {
  setupRenderingTest();

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
      async function () {
        this.setProperties({
          share: {
            publicUrl: shareUrl,
            publicRestUrl,
            handle: promiseObject(reject()),
          },
          selectedUrlType: 'handle',
        });

        await renderComponent();
        await clickTrigger('.col-key');

        const options = document.querySelectorAll('li.ember-power-select-option');
        checkUrlTypeOptions(options, ['share', 'rest']);
        expect(document.querySelector('.public-url-viewer-share'), 'share mode fallback')
          .to.exist;
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
        async function () {
          await renderComponent();
          await clickTrigger('.col-key');

          const options = document.querySelectorAll('li.ember-power-select-option');
          checkUrlTypeOptions(options, ['share', 'handle', 'rest']);
          expect(document.querySelector('.public-url-viewer-handle'), 'handle mode')
            .to.exist;
        }
      );

      testShowsUrlTypeInformationInPopover('handle', { rejectedHandleService: true });
    });

    it('can render handle service name',
      async function () {
        this.set('selectedUrlType', 'handle');

        await renderComponent();

        expect(
            document.querySelector('.input-handle-service-name'),
            'handle service name')
          .to.exist;
        expect(document.querySelector('.input-handle-service-name'))
          .to.contain.text(handleService.name);
      }
    );

    it('does not render handle service name if handle service rejects',
      async function () {
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

        await renderComponent();
        await clickTrigger('.col-key');

        expect(
          document.querySelector('.input-handle-service-name'),
          'handle service name'
        ).to.not.exist;
        expect(
          document.querySelector('.url-type-info-trigger.input-group-addon-icon .oneicon')
        ).to.exist;
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

      it('does not render handle service name, but only icon', async function () {
        this.set('selectedUrlType', 'handle');

        await renderComponent();

        expect(
          document.querySelector('.input-handle-service-name'),
          'handle service name'
        ).to.not.exist;
        expect(
          document.querySelector('.url-type-info-trigger.input-group-addon-icon .oneicon')
        ).to.exist;
      });

      it('renders handle, share and rest url options in selector', async function () {
        await renderComponent();

        await click('.url-type-selector-trigger');

        const options =
          document.querySelectorAll('.compact-url-type-selector-actions li');
        checkUrlTypeOptions(options, ['share', 'handle', 'rest']);
      });

      it('renders only "share" and "rest" url options without "handle" in selector if handle rejects',
        async function () {
          this.set('share', {
            publicUrl: shareUrl,
            publicRestUrl,
            handle: promiseObject(reject()),
          });

          await renderComponent();
          await click('.url-type-selector-trigger');

          const options =
            document.querySelectorAll('.compact-url-type-selector-actions li');
          checkUrlTypeOptions(options, ['share', 'rest']);
          expect(document.querySelector('.public-url-viewer-share')).to.exist;
        }
      );
    });

    context('without showHandle', function () {
      beforeEach(function () {
        this.set('showHandle', false);
      });

      testChangeSelectedUrlTypeCompact('share');
      testChangeSelectedUrlTypeCompact('rest');

      it('renders share and rest url options in selector', async function () {
        await renderComponent();

        await click('.url-type-selector-trigger');

        const options =
          document.querySelectorAll('.compact-url-type-selector-actions li');
        checkUrlTypeOptions(options, ['share', 'rest']);
      });
    });
  });

  ['share', 'handle', 'rest'].forEach(selectedUrlType => {
    it(`sets effSelectedUrlType to "${selectedUrlType}" for "${selectedUrlType}" selectedUrlType`,
      async function () {
        this.setProperties({
          selectedUrlType,
          showHandle: true,
        });
        await renderComponent();

        expect(get(getComponent(), 'effSelectedUrlType')).to.equal(selectedUrlType);
      });
  });

  it('sets effSelectedUrlType to default for "handle" selectedUrlType and no handle data beside of showHandle',
    async function () {
      this.setProperties({
        selectedUrlType: 'handle',
        showHandle: true,
        share: {
          name: 'Share name',
          entityId: 'share_id',
        },
      });
      await renderComponent();

      expect(get(getComponent(), 'effSelectedUrlType')).to.equal('share');
    }
  );

  it('sets effSelectedUrlType to default for "handle" selectedUrlType and showHandle beside of valid handle data',
    async function () {
      this.setProperties({
        selectedUrlType: 'handle',
        showHandle: false,
      });
      await renderComponent();

      expect(get(getComponent(), 'effSelectedUrlType')).to.equal(defaultUrlType);
    }
  );

  it('fallbacks effSelectedUrlType to default for non-defined selectedUrlType',
    async function () {
      this.setProperties({
        selectedUrlType: 'hello',
      });
      await renderComponent();

      expect(get(getComponent(), 'effSelectedUrlType')).to.equal(defaultUrlType);
    });
});

function testClipboardInput(type, evaluateValue) {
  it(`renders ${type} url in clipboard line if ${type} type is selected`, async function () {
    this.set('selectedUrlType', type);

    await renderComponent();

    const input = find('.clipboard-line-public-url-input');
    expect(input, 'clipboard-line-public-url-input').to.exist;
    expect(input).to.have.value(evaluateValue(this));
  });
}

function testChangeSelectedUrlTypeCompact(type) {
  it(`changes selectedUrlType to ${type} after selecting it from compact selector`, async function () {
    await renderComponent();
    await click('.url-type-selector-trigger');
    await click(`.option-${type}-link`);

    expect(find(`.public-url-viewer-${type}`), `.public-url-viewer-${type} (compact)`)
      .to.exist;
  });
}

function testChangeSelectedUrlTypePowerSelect(type) {
  it(`changes selectedUrlType to ${type} after selecting it from selector`, async function () {
    await renderComponent();
    await selectChoose('.col-key', urlTypeTranslations[type]);

    expect(find(`.public-url-viewer-${type}`), `.public-url-viewer-${type}`).to.exist;
  });
}

const urlTypeInfoChecks = {
  handle({ rejectedHandleService = false } = {}) {
    expect(
      document.querySelector('.handle-id-clipboard-line .clipboard-input'),
      'handle clipboard'
    ).to.exist;
    expect(
      document.querySelector('.handle-id-clipboard-line .clipboard-input')
    ).to.have.value(handleId);
    expect(
      document.querySelectorAll('.handle-service-id-clipboard-line .clipboard-input'),
      'handle service clipboard'
    ).to.have.length(rejectedHandleService ? 0 : 1);
    expect(document.querySelectorAll('.handle-service-name'))
      .to.have.length(rejectedHandleService ? 0 : 1);
    if (!rejectedHandleService) {
      expect(
        document.querySelector('.handle-service-id-clipboard-line .clipboard-input')
      ).to.have.value(handleService.entityId);
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
  it(`opens popover with information about "${type}" URL ${suffix}`, async function () {
    this.set('selectedUrlType', type);

    await renderComponent();
    await click('.url-type-info-trigger');

    expect(
      document.querySelector(`.url-type-info-content-${type}`),
      'url-type-info-content'
    ).to.exist;
    expect(
      document.querySelector('.webui-popover-url-type-info.in'),
      'webui-popover-url-type-info'
    ).to.exist;
    urlTypeInfoChecks[type](informationOptions);
  });
}

async function renderComponent() {
  await render(hbs `{{share-show/public-url-viewer
    share=share
    compact=compact
    showHandle=showHandle
    selectedUrlType=selectedUrlType
    changeSelectedUrlType=(action (mut selectedUrlType))
    testMode=true
  }}`);
}

function getComponent() {
  return find('.public-url-viewer').componentInstance;
}

function checkUrlTypeOptions(options, urlTypes) {
  expect(options).to.have.length(urlTypes.length);
  for (let i = 0; i < urlTypes.length; ++i) {
    expect(options[i]).to.contain.text(urlTypeTranslations[urlTypes[i]]);
  }
}
