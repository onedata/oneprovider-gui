import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { click, fillIn } from '@ember/test-helpers';
import { Promise } from 'rsvp';
import { clearStoreAfterEach } from '../../../helpers/clear-store';
import sleep from 'onedata-gui-common/utils/sleep';
import { exampleDataCiteMetadata } from 'oneprovider-gui/utils/mock-data';
import { replaceEmberAceWithTextarea } from '../../../helpers/ember-ace';
import sinon from 'sinon';
import ShareShowXmlOnlyMetadataHelper from '../../../helpers/share-show-xml-only-metadata';

describe('Integration | Component | share-show/data-cite', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(async function () {
    this.helper = new Helper(this);
    await this.helper.init();
    replaceEmberAceWithTextarea(this);
  });

  clearStoreAfterEach(afterEach);

  it('renders header and always-visible text intro in create mode',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();
      await helper.createHandle({
        metadataString: exampleDataCiteMetadata,
      });

      // when
      await helper.render({
        isReadOnly: false,
        isPublished: false,
      });

      // then
      expect(helper.element, 'main element').to.exist;
      expect(helper.element.querySelector('h1')?.textContent)
        .to.contain('DataCite metadata');
      expect(helper.element.textContent)
        .to.contain('Carefully compose the DataCite metadata below');
    }
  );

  it('renders metadata string in ACE editor when handle is provided',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();
      await helper.createHandle({
        metadataString: exampleDataCiteMetadata,
      });

      // when
      await helper.render({
        isReadOnly: true,
        isPublished: true,
      });

      // then
      expect(helper.editor.value?.trim()).to.equal(exampleDataCiteMetadata.trim());
    }
  );

  it('does not render footer toolbar with back/submit buttons when is published and readonly',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();
      await helper.createHandle({
        metadataString: exampleDataCiteMetadata,
      });

      // when
      await helper.render({
        isReadOnly: true,
        isPublished: true,
      });

      // then
      expect(helper.submitButton).to.not.exist;
      expect(helper.backButton).to.not.exist;
    }
  );

  it('allows to input metadata and submit',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();
      const inputXml = generateSimpleXml();

      let submitResolver;
      const onSubmit = sinon.stub().callsFake(() =>
        new Promise(resolve => { submitResolver = resolve; })
      );

      // when
      await helper.render({
        isReadOnly: false,
        isPublished: false,
        onSubmit,
      });
      await fillIn(helper.editor, inputXml);
      const clickPromise = click(helper.submitButton);

      // then
      // Let the button go into pending state.
      await sleep(0);
      expect(helper.submitButton).to.have.attr('disabled');
      submitResolver();
      await clickPromise;
      expect(helper.submitButton).to.not.have.attr('disabled');
      expect(onSubmit).to.have.been.calledOnce;
      expect(onSubmit).to.have.been.calledWith(inputXml);
    }
  );

  it('shows active modify button when handle is provided and is not in public view',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSpace();
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();

      // when
      await helper.render({
        isReadOnly: true,
        isPublished: true,
        isPublicView: false,
      });

      // then
      expect(helper.modifyButton).to.exist;
      expect(helper.modifyButton).to.not.have.attr('disabled');
    }
  );

  it('does not show modify button in create mode',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();

      // when
      await helper.render({
        isReadOnly: false,
        isPublished: false,
        isPublicView: false,
      });

      // then
      expect(helper.modifyButton).to.not.exist;
    }
  );

  it('fills editor with initial XML on init in create mode',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();

      // when
      helper.createInitialData('2025-01-02');
      helper.initialData =
        await helper.render({
          isReadOnly: false,
          isPublished: false,
          isPublicView: false,
        });

      // then
      expect(helper.editor.value)
        .to.contain(`<creatorName>${helper.user.name}</creatorName>`);
    }
  );
});

function generateSimpleXml() {
  return `<resource
    xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4.1/metadata.xsd"
  >
    <identifier identifierType="DOI">10.5072/example-full</identifier>
  </resource>
`;

}

class Helper extends ShareShowXmlOnlyMetadataHelper {
  /** @override */
  get componentPath() {
    return 'share-show/data-cite';
  }

  /** @override */
  get componentSelector() {
    return '.share-show-data-cite';
  }
}
