import { hbs } from 'ember-cli-htmlbars';
import { find } from '@ember/test-helpers';
import FileSharesViewModel from 'oneprovider-gui/utils/file-shares-view-model';
import { lookupService, registerService } from './stub-service';
import { all as allFulfilled } from 'rsvp';
import createSpace from './create-space';
import { get } from '@ember/object';
import Service from '@ember/service';
import sinon from 'sinon';
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';
import gri from 'onedata-gui-websocket-client/utils/gri';

const AppProxyMock = Service.extend({
  callParent() {},
});

export default class FileSharesHelper {
  /**
   * @param {Mocha.Context} context
   */
  constructor(context) {
    this.context = context;
    this.store = lookupService(this.context, 'store');
    this.appProxyMock = registerService(this.context, 'appProxy', AppProxyMock);
    this.viewModelOptions = {};
  }
  async createFile(properties = {}) {
    return await this.store.createRecord('file', {
      name: 'dummy file',
      type: 'file',
      posixPermissions: '644',
      activePermissionsType: 'posix',
      sharesCount: 0,
      ...properties,
    }).save();
  }
  async createSpace() {
    return await createSpace(this.store);
  }
  async createViewModel() {
    if (!this.file) {
      throw new Error('files in helper not implemented');
    }
    return FileSharesViewModel.create({
      ownerSource: this.context.owner,
      space: await this.createSpace(),
      file: this.file,
      ...this.viewModelOptions,
    });
  }
  async beforeRender() {
    this.context.setProperties({
      viewModel: await this.createViewModel(),
    });
  }
  async renderBody() {
    await this.beforeRender();
    await this.context.render(hbs`
      {{file-shares/body
        viewModel=viewModel
      }}
    `);
  }
  get bodySelector() {
    return '.file-shares-body';
  }
  getBody() {
    return find(this.bodySelector);
  }
  async createShare(data = {}) {
    return await this.store.createRecord('share', {
      name: 'Dummy share',
      publicUrl: 'https://www.example.com/public/dummy',
      publicRestUrl: 'https://www.example.com/public_rest/dummy',
      description: 'Dummy description',
      spaceId: 'dummy_space_id',
      handle: null,
      ...data,
    }).save();
  }
  async waitForSharesLoad() {
    return await get(await this.file, 'shareRecords');
  }
  createShareGri(shareId) {
    return gri({
      entityType: shareEntityType,
      entityId: shareId,
      aspect: 'instance',
    });
  }
  getShareItems() {
    return this.getBody().querySelectorAll('.file-share-item');
  }

  async givenFile(data = {}) {
    this.file = await this.createFile(data);
  }
  async givenShares(shares = []) {
    const file = this.file;
    for (const share of shares) {
      share.setProperties({
        rootFile: file,
        privateRootFile: file,
        rootFileType: get(file, 'type'),
      });
    }
    await allFulfilled(shares.invoke('save'));
    this.file.setProperties({
      shareRecords: shares,
      sharesCount: shares.length,
    });
    await this.file.save();
  }
  async givenSimpleAppProxyStub() {
    sinon.stub(this.appProxyMock, 'callParent')
      .withArgs('getShareUrl')
      .returns('https://example.com/private_share');
  }
}
