import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Promise } from 'rsvp';
import { lookupService } from '../../../helpers/stub-service';
import { clearStoreAfterEach } from '../../../helpers/clear-store';
import { FileType } from 'onedata-gui-common/utils/file';
import { defineProperty } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import sleep from 'onedata-gui-common/utils/sleep';
import { MetadataType } from 'oneprovider-gui/models/handle';
import { exampleDataCiteMetadata } from 'oneprovider-gui/utils/mock-data';
import { replaceEmberAceWithTextarea } from '../../../helpers/ember-ace';
import sinon from 'sinon';
import moment from 'moment';

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

class Helper {
  user;
  handleServiceList;

  /**
   * @param {Mocha.Context} mochaContext
   */
  constructor(mochaContext) {
    this.mochaContext = mochaContext;
  }

  async init() {
    await this.createUser();
  }

  getService(serviceName) {
    return lookupService(this.mochaContext, serviceName);
  }

  async saveRecord(type, data) {
    return this.store.createRecord(type, data).save();
  }

  get store() {
    return this.getService('store');
  }

  async createUser() {
    this.user = await this.saveRecord('user', {
      id: gri({
        entityType: userEntityType,
        entityId: 'user1',
        aspect: 'instance',
        scope: 'private',
      }),
      fullName: 'Czesiek',
      username: 'joe',
    });
    defineProperty(this.getService('currentUser'), 'userId', {
      value: this.user.entityId,
    });
  }

  async createEmptyHandleServices() {
    if (this.handleServiceList) {
      throw new Error('handle services already defined');
    }
    this.handleServiceList = await this.saveRecord('handleServiceList', { list: [] });
    this.user.set('effHandleServiceList', this.handleServiceList);
    await this.user.save();
  }

  async createSingleHandleService(data = {}) {
    if (this.handleServiceList) {
      throw new Error('handle services already defined');
    }
    const handleService = await this.saveRecord('handleService', {
      name: 'Dummy handle service',
      ...data,
    });
    this.handleServiceList = await this.saveRecord('handleServiceList', {
      list: [handleService],
    });
    this.user.set('effHandleServiceList', this.handleServiceList);
    await this.user.save();
  }

  async createShare(data) {
    if (this.share) {
      throw new Error('share is already initialized');
    }
    this.share = await this.saveRecord('share', {
      name: 'Hello-Share',
      publicUrl: 'https://example.com/my-share',
      ...data,
    });
  }

  async createSpace(data) {
    this.space = await this.saveRecord('space', {
      name: 'Dummy space',
      currentUserIsOwner: true,
      ...data,
    });
  }

  async createHandle(data) {
    if (this.handle) {
      throw new Error('handle is already initialized');
    }
    const handleService = data.handleService ?? this.getHandleServices()[0];
    if (!handleService) {
      throw new Error('no handle service provided/available');
    }
    this.handle = await this.saveRecord('handle', {
      url: 'https://example.com/share1',
      metadataSchema: MetadataType.DublinCore,
      handleService,
      ...data,
    });
    this.share.set('handle', this.handle);
    await this.share.save();
  }

  async createRootFile() {
    this.rootFile = await this.saveRecord('file', {
      name: 'Dummy root file',
      type: FileType.Regular,
    });
    this.share.set('rootFile', this.rootFile);
    this.share.save();
  }

  async createInitialData(dateString) {
    /** @type {import('../../../../app/components/share-show/pane-publicdata').PublicDataInitialMetadata} */
    this.initialData = {
      title: this.share.name,
      creator: this.user.name,
      description: '',
      date: dateString ?? moment().format('YYYY-MM-DD'),
      shareUrl: this.share.publicUrl,
    };
  }

  getHandleServices() {
    return this.handleServiceList.list.content.toArray();
  }

  get element() {
    return this.mochaContext.element.querySelector('.share-show-data-cite');
  }

  /** @type {HTMLTextAreaElement} */
  get editor() {
    return this.element.querySelector('.ember-ace-data-cite-source textarea');
  }

  /** @type {HTMLButtonElement} */
  get submitButton() {
    return this.element.querySelector('.metadata-editor-footer .btn-submit');
  }

  /** @type {HTMLButtonElement} */
  get backButton() {
    return this.element.querySelector('.metadata-editor-footer .btn-back');
  }

  get modifyButton() {
    return this.element.querySelector('.modify-metadata-btn');
  }

  /**
   * @param {Object} options
   * @param {string} options.xmlValue
   * @param {boolean} [options.isReadOnly]
   * @param {boolean} [options.isPublished]
   * @param {boolean} [options.isPublicView]
   * @param {Models.HandleService} [options.handleService]
   * @param {(metadataXml: string) => Promise} [options.onModify]
   * @param {(xml: string) => void} [options.onUpdateXml]
   * @param {(metadataXml: string) => Promise} [options.onSubmit]
   * @param {() => void} [options.onBack]
   */
  async render(options = {}) {
    this.mochaContext.renderArgs = {
      xmlValue: this.handle?.metadataString,
      space: this.space,
      initialData: this.initialData,
      ...options,
    };
    this.mochaContext.set('onBack', 'test1');
    await render(hbs`
    <div class="share-show">
      <ShareShow::DataCite
        @xmlValue={{this.renderArgs.xmlValue}}
        @isReadOnly={{this.renderArgs.isReadOnly}}
        @isPublished={{this.renderArgs.isPublished}}
        @isPublicView={{this.renderArgs.isPublicView}}
        @space={{this.renderArgs.space}}
        @handleService={{this.renderArgs.handleService}}
        @initialData={{this.renderArgs.initialData}}
        @onModify={{this.renderArgs.onModify}}
        @onUpdateXml={{this.renderArgs.onUpdateXml}}
        @onSubmit={{this.renderArgs.onSubmit}}
        @onBack={{this.renderArgs.onBack}}
      />
    </div>
    `);
  }
}

function generateSimpleXml() {
  return `<resource
    xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4.1/metadata.xsd"
  >
    <identifier identifierType="DOI">10.5072/example-full</identifier>
  </resource>
`;

}
