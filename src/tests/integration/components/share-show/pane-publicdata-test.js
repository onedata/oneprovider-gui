import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { lookupService } from '../../../helpers/stub-service';
import { clearStoreAfterEach } from '../../../helpers/clear-store';
import { FileType } from 'onedata-gui-common/utils/file';
import { defineProperty } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import OneDropdownHelper from '../../../helpers/one-dropdown';
import { findByText } from '../../../helpers/find';
import { MetadataType } from 'oneprovider-gui/models/handle';
import {
  exampleDataCiteMetadata,
  exampleDublinCoreShort,
  exampleEdmValidXml,
  exampleOpenAireMetadata,
} from 'oneprovider-gui/utils/mock-data';
import { replaceEmberAceWithTextarea } from '../../../helpers/ember-ace';
import sinon from 'sinon';

const metadataTypes = Object.values(MetadataType);

const metadataNameMap = {
  [MetadataType.DataCite]: 'DataCite',
  [MetadataType.DublinCore]: 'Dublin Core',
  [MetadataType.Edm]: 'Europeana Data Model',
  [MetadataType.OpenAire]: 'OpenAIRE',
};

const metadataNames = Object.values(metadataNameMap);

const validXmls = {
  [MetadataType.DublinCore]: exampleDublinCoreShort,
  [MetadataType.Edm]: exampleEdmValidXml,
  [MetadataType.DataCite]: exampleDataCiteMetadata,
  [MetadataType.OpenAire]: exampleOpenAireMetadata,
};

describe('Integration | Component | share-show/pane-publicdata', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(async function () {
    this.helper = new Helper(this);
    await this.helper.init();
    replaceEmberAceWithTextarea(this, {
      classname: 'metadata-xml-source-textarea',
    });
  });

  clearStoreAfterEach(afterEach);

  it('renders only "no handle services" message if there are no handle services',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createEmptyHandleServices();
      await helper.createShare();
      await helper.createRootFile();
      await helper.createSpace();

      // when
      await helper.render();

      // then
      expect(helper.element.querySelector('.content-info')?.textContent)
        .to.contain('You do not have access to any handle service');
      expect(helper.element.querySelector('.publicdata-one-carousel')).to.not.exist;
    }
  );

  it('renders welcome screen with handle service dropdown when at least single handle service is present',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();
      await helper.createSpace();

      // when
      await helper.render();
      const dropdown = helper.getHandleServiceDropdown();
      const handleServiceOptions = await dropdown.getOptionsText();

      // then
      expect(helper.element.querySelector('.content-info')?.textContent)
        .to.contain('Expose as Public Data');
      expect(handleServiceOptions).to.have.lengthOf(1);
      expect(handleServiceOptions[0])
        .to.contain(helper.getHandleServices()[0].name);
    }
  );

  it('renders dropdown with all available metadata types',
    async function () {
      // given
      /** @type {Helper} */
      const helper = this.helper;
      await helper.createSingleHandleService();
      await helper.createShare();
      await helper.createRootFile();
      await helper.createSpace();

      // when
      await helper.render();
      const dropdown = helper.getMedatataTypeDropdown();
      const metadataTypeOptions = await dropdown.getOptionsText();

      // then
      expect(metadataTypeOptions).to.have.lengthOf(metadataNames.length);
      for (const [index, metadataType] of metadataNames.entries()) {
        expect(metadataTypeOptions[index]).to.contain(metadataType);
      }
    }
  );

  const onlyXmlSpecs = [{
      metadataType: MetadataType.DataCite,
      componentSelector: '.share-show-data-cite',
    },
    {
      metadataType: MetadataType.OpenAire,
      componentSelector: '.share-show-open-aire',
    },
  ];

  for (const { metadataType, componentSelector } of onlyXmlSpecs) {
    const metadataTypeName = metadataNameMap[metadataType];

    it(`renders ${metadataTypeName} editor after selecting ${metadataTypeName} metadata type and proceeding`,
      async function () {
        // given
        /** @type {Helper} */
        const helper = this.helper;
        await helper.createSingleHandleService();
        await helper.createShare();
        await helper.createRootFile();
        await helper.createSpace();

        // when
        await helper.render();
        expect(helper.element.querySelector(componentSelector)).to.not.exist;
        await helper
          .getHandleServiceDropdown()
          .selectOptionByText(helper.getHandleServices()[0].name);
        await helper.getMedatataTypeDropdown().selectOptionByText(metadataTypeName);
        await click(helper.proceedButton);

        // then
        expect(helper.element.querySelector(componentSelector)).to.exist;
      }
    );

    it(`renders ${metadataTypeName} component when there is share with handle of ${metadataType} type`,
      async function () {
        // given
        /** @type {Helper} */
        const helper = this.helper;
        await helper.createSingleHandleService();
        await helper.createShare();
        await helper.createHandle({
          metadataString: validXmls[metadataType],
          metadataSchema: metadataType,
        });
        await helper.createRootFile();
        await helper.createSpace();

        // when
        await helper.render();

        // then
        expect(helper.element.querySelector(componentSelector)).to.exist;
      }
    );

    it(`changes view back to welcome screen when using back button on ${metadataTypeName} create view`,
      async function () {
        // given
        /** @type {Helper} */
        const helper = this.helper;
        await helper.createSingleHandleService();
        await helper.createShare();
        await helper.createRootFile();
        await helper.createSpace();
        await helper.render();
        await helper
          .getHandleServiceDropdown()
          .selectOptionByText(helper.getHandleServices()[0].name);
        await helper.getMedatataTypeDropdown().selectOptionByText(metadataTypeName);
        await click(helper.proceedButton);
        expect(
          helper.element.querySelector('[data-one-carousel-slide-id="createMetadata"]')
        ).to.have.class('active-from-right');

        // when
        await click(helper.element.querySelector('.metadata-editor-footer .btn-back'));

        // then
        expect(
          helper.element.querySelector('[data-one-carousel-slide-id="welcome"]')
        ).to.have.class('active-from-left');
      }
    );

    it(`changes mode of ${metadataTypeName} component from viewer to editor when using modify button`,
      async function () {
        // given
        /** @type {Helper} */
        const helper = this.helper;
        await helper.createSingleHandleService();
        await helper.createShare();
        await helper.createHandle({
          metadataString: validXmls[metadataType],
          metadataSchema: metadataType,
        });
        await helper.createRootFile();
        await helper.createSpace();
        await helper.render();
        const textarea =
          helper.element.querySelector('.ember-ace-xml-only-metadata-source textarea');

        // when
        expect(textarea).to.have.attribute('disabled');
        await click(helper.element.querySelector('.modify-metadata-btn'));

        // then
        expect(textarea).to.not.have.attribute('disabled');
      }
    );
  }

  for (const metadataType of metadataTypes) {
    const metadataTypeName = metadataNameMap[metadataType];
    it(`shows error modal if create handle with ${metadataTypeName} metadata fails`,
      async function () {
        // given
        /** @type {Helper} */
        const helper = this.helper;
        await helper.createSingleHandleService();
        await helper.createShare();
        await helper.createRootFile();
        await helper.createSpace();
        const globalNotify = helper.getService('globalNotify');
        const handleManager = helper.getService('handleManager');
        const mockError = new Error('mock createHandle error');
        const backendErrorStub = sinon.stub(globalNotify, 'backendError');
        sinon.stub(handleManager, 'createHandle').throws(mockError);

        // when
        await helper.render();
        await helper
          .getHandleServiceDropdown()
          .selectOptionByText(helper.getHandleServices()[0].name);
        await helper.getMedatataTypeDropdown().selectOptionByText(metadataTypeName);
        await click(helper.proceedButton);
        await click(helper.element.querySelector('.btn-xml-editor'));
        await fillIn(
          helper.element.querySelector('.metadata-xml-source-textarea'),
          validXmls[metadataType]
        );
        if (metadataType === MetadataType.Edm) {
          await click(helper.element.querySelector('.apply-xml-btn'));
        }
        await click(helper.element.querySelector('.btn-submit'));

        // then
        expect(backendErrorStub).to.have.been.calledOnce;
      }
    );

    it(`shows error modal if modifying handle with ${metadataTypeName} metadata fails`,
      async function () {
        // given
        /** @type {Helper} */
        const helper = this.helper;
        await helper.createSingleHandleService();
        await helper.createShare();
        const initialMetadata = validXmls[metadataType];
        const newMetadata = initialMetadata + '<!-- hello -->';
        await helper.createHandle({
          metadataString: initialMetadata,
          metadataSchema: metadataType,
        });
        await helper.createRootFile();
        await helper.createSpace();
        const globalNotify = helper.getService('globalNotify');
        const mockError = new Error('mock handle.save error');
        const backendErrorStub = sinon.stub(globalNotify, 'backendError');
        sinon.stub(helper.handle, 'save').throws(mockError);

        // when
        await helper.render();
        await click(helper.element.querySelector('.btn-xml-editor'));
        await click(helper.element.querySelector('.modify-metadata-btn'));
        await fillIn(
          helper.element.querySelector('.metadata-xml-source-textarea'),
          newMetadata
        );
        if (metadataType === MetadataType.Edm) {
          await click(helper.element.querySelector('.apply-xml-btn'));
        }
        await click(helper.element.querySelector('.btn-submit'));

        // then
        expect(backendErrorStub).to.have.been.calledOnce;
      }
    );

    it(`updates metadataString in handle record for ${metadataTypeName} metadata type after modify`,
      async function () {
        // --- given ---
        /** @type {Helper} */
        const helper = this.helper;
        await helper.createSingleHandleService();
        await helper.createShare();
        const initialMetadata = validXmls[metadataType];
        const newMetadata = initialMetadata + '\n<!-- hello -->';
        await helper.createHandle({
          metadataString: initialMetadata,
          metadataSchema: metadataType,
        });
        await helper.createRootFile();
        await helper.createSpace();

        // --- when ---
        await helper.render();
        await click(helper.element.querySelector('.btn-xml-editor'));
        await click(helper.element.querySelector('.modify-metadata-btn'));
        await fillIn(
          helper.element.querySelector('.metadata-xml-source-textarea'),
          newMetadata
        );
        if (metadataType === MetadataType.Edm) {
          await click(helper.element.querySelector('.apply-xml-btn'));
        }
        expect(helper.element.querySelector('.modify-metadata-btn'))
          .to.have.attr('disabled');
        await click(helper.element.querySelector('.btn-submit'));

        // --- then ---
        // The XML generator adds spaces after some lines, but our example metadata
        // srings does not have them, because IDE automatically trims them. Normalize
        // persisted string for comparation.
        const expectedPersistedMetadata = helper.handle.metadataString
          .replaceAll(/ +\n/g, '\n').trim();
        expect(expectedPersistedMetadata).to.equal(newMetadata.trim());
        // View should go back into read only state.
        expect(helper.element.querySelector('.modify-metadata-btn'))
          .to.not.have.attr('disabled');
      }
    );
  }
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

  getMedatataTypeDropdown() {
    return new OneDropdownHelper('.select-metadata-type');
  }

  getHandleServiceDropdown() {
    return new OneDropdownHelper('.select-handle-service');
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

  async createSpace(data) {
    this.space = await this.saveRecord('space', {
      name: 'Dummy space',
      currentUserIsOwner: true,
      ...data,
    });
  }

  getHandleServices() {
    return this.handleServiceList.list.content.toArray();
  }

  get element() {
    return this.mochaContext.element.querySelector('.pane-publicdata');
  }

  get proceedButton() {
    return findByText('Proceed', 'button');
  }

  /**
   * @param {Object} options
   * @param {boolean} options.publicMode
   * @param {Models.Space} options.space
   * @param {Models.Share} options.share
   * @param {string} options.dirId
   * @param {Function} options.updateDirId
   * @param {Function} options.getDataUrl
   * @param {PromiseObject} options.shareRootDeletedProxy
   */
  async render(options = {}) {
    this.mochaContext.renderArgs = {
      share: this.share,
      space: this.space,
      ...options,
    };
    await render(hbs`
    <div class="share-show">
      <ShareShow::PanePublicdata
        @publicMode={{this.renderArgs.publicMode}}
        @space={{this.renderArgs.space}}
        @share={{this.renderArgs.share}}
        @dirId={{this.renderArgs.dirId}}
        @updateDirId={{this.renderArgs.updateDirId}}
        @getDataUrl={{this.renderArgs.getDataUrl}}
        @shareRootDeletedProxy={{this.renderArgs.shareRootDeletedProxy}}
      />
    </div>
    `);
  }
}
