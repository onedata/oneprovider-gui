import { expect } from 'chai';
import { hbs } from 'ember-cli-htmlbars';
import { find } from '@ember/test-helpers';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import { lookupService } from './stub-service';
import { all as allFulfilled } from 'rsvp';
import { findByText } from './find';
import { click } from '@ember/test-helpers';
import createSpace from './create-space';
import DefaultUserHelper from './default-user';

export default class FilePermissionsHelper {
  /**
   * @param {Mocha.Context} context
   */
  constructor(context) {
    this.context = context;
    this.store = lookupService(this.context, 'store');
    this.viewModelOptions = {};
    /** @type {Promise<Models.User>} */
    this.defaultOwnerPromise = false;
    this.defaultUserHelper = new DefaultUserHelper(context);
  }
  async getDefaultOwner() {
    return this.defaultUserHelper.getDefaultUser();
  }
  async createFile(properties = {}) {
    let parent = properties.parent;
    if (!parent) {
      parent = await this.store.createRecord('file', {
        name: 'dummy root',
        type: 'dir',
        posixPermissions: '644',
        activePermissionsType: 'posix',
        owner: await this.getDefaultOwner(),
        parent: null,
      }).save();
    }
    return await this.store.createRecord('file', {
      name: 'dummy file',
      type: 'file',
      posixPermissions: '644',
      activePermissionsType: 'posix',
      owner: await this.getDefaultOwner(),
      parent,
      ...properties,
    }).save();
  }
  async createSpace() {
    return await createSpace(this.store, {
      currentUserIsOwner: true,
    });
  }
  createExampleAce(exampleNumber = 0) {
    const examples = [{
      identifier: 'OWNER@',
      aceType: 'ALLOW',
      aceMask: 459263,
      aceFlags: 0,
    }, {
      identifier: 'EVERYONE@',
      aceType: 'ALLOW',
      aceMask: 127,
      aceFlags: 0,
    }];
    return examples[exampleNumber % examples.length];
  }
  async createAcl(aces = []) {
    return await this.store.createRecord('acl', { list: aces }).save();
  }
  async createViewModel() {
    if (!this.files) {
      throw new Error('files in helper not implemented');
    }
    return FilePermissionsViewModel.create({
      ownerSource: this.context.owner,
      space: await this.createSpace(),
      files: this.files,
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
      {{file-permissions/body
        viewModel=viewModel
      }}
    `);
  }
  async renderAll() {
    await this.beforeRender();
    await this.context.render(hbs`
      {{file-permissions/header
        viewModel=viewModel
      }}
      {{file-permissions/body
        viewModel=viewModel
      }}
      {{file-permissions/footer
        viewModel=viewModel
      }}
  `);
  }
  get bodySelector() {
    return '.file-permissions-body';
  }
  get footerSelector() {
    return '.file-permissions-footer';
  }
  getBody() {
    return find(this.bodySelector);
  }
  getFooter() {
    return find(this.footerSelector);
  }
  getPosixPermissionsEditor() {
    return this.getBody().querySelector('.posix-permissions-editor');
  }
  getAclPermissionsEditor() {
    return this.getBody().querySelector('.acl-editor');
  }
  getDiscardButton() {
    return this.getFooter().querySelector('.btn-discard');
  }
  getSaveButton() {
    return this.getFooter().querySelector('.btn-save');
  }

  async givenSingleFilePosix(posixPermissions = '644') {
    this.files = [
      await this.createFile({ posixPermissions }),
    ];
  }
  async givenDifferentPosix() {
    this.files = await allFulfilled([
      this.createFile({ posixPermissions: '644' }),
      this.createFile({ posixPermissions: '777' }),
    ]);
  }
  async givenDifferentAcl() {
    const acls = await allFulfilled([
      this.createAcl([this.createExampleAce(0)]),
      this.createAcl([this.createExampleAce(1)]),
    ]);
    this.files = await allFulfilled([
      this.createFile({
        activePermissionsType: 'acl',
        acl: acls[0],
      }),
      this.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);
  }

  async whenClearPermissionsIsClicked() {
    const clearPermissions = find('.clear-permissions-btn');
    expect(clearPermissions, 'clear permissions button').exists;
    await click(clearPermissions);
  }

  thenExpectVisiblePosixEditor() {
    const posixEditor = this.getPosixPermissionsEditor();
    expect(posixEditor).to.exist;
    expect(posixEditor).to.not.have.class('hidden');
  }
  thenExpectHiddenPosixEditor() {
    const posixEditor = this.getPosixPermissionsEditor();
    expect(posixEditor).to.exist;
    expect(posixEditor).to.have.class('hidden');
  }
  thenExpectVisibleAclEditor() {
    const aclEditor = this.getAclPermissionsEditor();
    expect(aclEditor).to.exist;
    expect(aclEditor).to.not.have.class('hidden');
  }
}
