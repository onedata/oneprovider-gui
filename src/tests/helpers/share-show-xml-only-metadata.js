import { render } from '@ember/test-helpers';
import { lookupService } from './stub-service';
import { hbs } from 'ember-cli-htmlbars';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { defineProperty } from '@ember/object';
import { MetadataType } from 'oneprovider-gui/models/handle';
import { FileType } from 'onedata-gui-common/utils/file';
import moment from 'moment';

export default class ShareShowXmlOnlyMetadataHelper {
  user;
  handleServiceList;

  get componentPath() {
    throw new Error('ShareShowXmlOnlyMetadataHelper.componentPath not implemented');
  }

  get componentSelector() {
    throw new Error('ShareShowXmlOnlyMetadataHelper.componentSelector not implemented');
  }

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
    return this.mochaContext.element.querySelector(this.componentSelector);
  }

  /** @type {HTMLTextAreaElement} */
  get editor() {
    return this.element.querySelector('.ember-ace-xml-only-metadata-source textarea');
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
    this.mochaContext.set('componentPath', this.componentPath);
    await render(hbs`
    <div class="share-show">
      {{#let (component this.componentPath) as |metadataComponent|}}
        <metadataComponent
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
      {{/let}}
    </div>
    `);
  }
}
