import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { click, fillIn } from '@ember/test-helpers';
import { Promise } from 'rsvp';
import { clearStoreAfterEach } from '../../../helpers/clear-store';
import sleep from 'onedata-gui-common/utils/sleep';
import { exampleOpenAireMetadata } from 'oneprovider-gui/utils/mock-data';
import { replaceEmberAceWithTextarea } from '../../../helpers/ember-ace';
import sinon from 'sinon';
import ShareShowXmlOnlyMetadataHelper from '../../../helpers/share-show-xml-only-metadata';

describe('Integration | Component | share-show/open-aire', function () {
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
        metadataString: exampleOpenAireMetadata,
      });

      // when
      await helper.render({
        isReadOnly: false,
        isPublished: false,
      });

      // then
      expect(helper.element, 'main element').to.exist;
      expect(helper.element.querySelector('h1')?.textContent)
        .to.contain('OpenAIRE metadata');
      expect(helper.element.textContent)
        .to.contain('Carefully compose the OpenAIRE metadata below');
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
        metadataString: exampleOpenAireMetadata,
      });

      // when
      await helper.render({
        isReadOnly: true,
        isPublished: true,
      });

      // then
      expect(helper.editor.value?.trim()).to.equal(exampleOpenAireMetadata.trim());
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
        metadataString: exampleOpenAireMetadata,
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
        .to.contain(`<datacite:creatorName>${helper.user.name}</datacite:creatorName>`);
      expect(helper.editor.value)
        .to.contain('>2025-01-02</datacite:date>');
    }
  );
});

function generateSimpleXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- OpenAIRE XML metadata; refer to: https://openaire-guidelines-for-literature-repository-managers.readthedocs.io/en/v4.0.0/application_profile.html -->
<oaire:resource
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:datacite="http://datacite.org/schema/kernel-4"
 xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning"
 xmlns:oaire="http://namespace.openaire.eu/schema/oaire/"
 xsi:schemaLocation="http://namespace.openaire.eu/schema/oaire/ https://www.openaire.eu/schema/repo-lit/4.0/openaire.xsd">
    <datacite:titles>
        <datacite:title>Hello</datacite:title>
    </datacite:titles>
    <datacite:creators>
        <datacite:creator>
            <datacite:creatorName>John</datacite:creatorName>
        </datacite:creator>
    </datacite:creators>
    <dc:language>eng</dc:language>
    <datacite:dates>
        <datacite:date dateType="Issued">2021-02-03</datacite:date>
    </datacite:dates>
    <oaire:resourceType resourceTypeGeneral="literature" uri="http://purl.org/coar/resource_type/c_93fc">report</oaire:resourceType>
    <datacite:rights rightsURI="http://purl.org/coar/access_right/c_abf2">open access</datacite:rights>
</oaire:resource>`;
}

class Helper extends ShareShowXmlOnlyMetadataHelper {
  /** @override */
  get componentPath() {
    return 'share-show/open-aire';
  }

  /** @override */
  get componentSelector() {
    return '.share-show-open-aire';
  }
}
