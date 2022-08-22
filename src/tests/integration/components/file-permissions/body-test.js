import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { find } from '@ember/test-helpers';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import { lookupService } from '../../../helpers/stub-service';
import { all as allSettled } from 'rsvp';
import { findByText } from '../../../helpers/find';
import { click } from '@ember/test-helpers';

describe('Integration | Component | file-permissions/body', function () {
  setupRenderingTest();

  it('renders visible POSIX permissions editor when all files permissions are the same POSIX', async function () {
    const helper = new Helper(this);
    helper.files = await allSettled([
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
      }),
    ]);

    await helper.render();

    const element = helper.getElement();
    const posixEditor = helper.getPosixPermissionsEditor();
    expect(element).to.exist;
    expect(posixEditor).to.not.have.class('hidden');
    expect(find('.alert')).to.not.exist;
  });

  it('renders incompatible POSIX permissions alert when files permissions different POSIX', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentPosix();

    await helper.render();

    helper.thenExpectHiddenPosixEditor();
    const alertElement = find('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text(
      'Selected files have different POSIX permissions.'
    );
  });

  it('renders visible ACL permissions editor when all files permissions are the same ACL', async function () {
    const helper = new Helper(this);
    const acls = await allSettled([
      helper.createAcl([helper.createExampleAce(0)]),
      helper.createAcl([helper.createExampleAce(0)]),
    ]);
    helper.files = await allSettled([
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[0],
      }),
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await helper.render();

    const element = helper.getElement();
    const aclEditor = helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.not.exist;
    expect(element).to.exist;
    expect(aclEditor).to.not.have.class('hidden');
  });

  it('renders "different ACL" alert when both files have ACL but with different rules', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentAcl();

    await helper.render();

    const element = helper.getElement();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text('Selected files have different ACL rules.');
  });

  it('renders "different ACL" alert when one file have POSIX and other ACL', async function () {
    const helper = new Helper(this);
    const acls = await allSettled([
      helper.createAcl([]),
      helper.createAcl([helper.createExampleAce()]),
    ]);
    helper.files = await allSettled([
      helper.createFile({
        activePermissionsType: 'posix',
        posixPermissions: '644',
        acl: acls[0],
      }),
      helper.createFile({
        activePermissionsType: 'acl',
        acl: acls[1],
      }),
    ]);

    await helper.render();

    const element = helper.getElement();
    const aclEditor = helper.getAclPermissionsEditor();
    const alertElement = element.querySelector('.alert');
    expect(alertElement).to.exist;
    expect(alertElement).to.have.class('alert-warning');
    expect(alertElement).to.contain.text('Selected files have different ACL rules.');
    expect(element).to.exist;
    expect(aclEditor).to.have.class('hidden');
  });

  it('unhides POSIX editor when clicking on "Edit anyway" from "different alert"', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentPosix();
    await helper.render();

    await helper.whenEditAnywayIsClicked();

    helper.thenExpectVisiblePosixEditor();
  });

  it('unhides ACL editor when clicking on "Edit anyway" from "different alert"', async function () {
    const helper = new Helper(this);
    await helper.givenDifferentAcl();
    await helper.render();

    await helper.whenEditAnywayIsClicked();

    helper.thenExpectVisibleAclEditor();
  });
});

class Helper {
  /**
   * @param {Mocha.Context} context
   */
  constructor(context) {
    this.context = context;
    this.store = lookupService(this.context, 'store');
  }
  async createFile(properties = {}) {
    return await this.store.createRecord('file', {
      name: 'dummy file',
      type: 'file',
      posixPermissions: '644',
      activePermissionsType: 'posix',
      ...properties,
    }).save();
  }
  async createSpace() {
    const listRecords = {
      effUserList: this.store.createRecord('user-list', { list: [] }),
      effGroupList: this.store.createRecord('group-list', { list: [] }),
    };
    await allSettled(Object.values(listRecords).map(r => r.save()));
    return await this.store.createRecord('space', {
      name: 'test space',
      ...listRecords,
    }).save();
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
    });
  }
  async render() {
    this.context.setProperties({
      viewModel: await this.createViewModel(),
    });
    await this.context.render(hbs`
      {{file-permissions/body
        viewModel=viewModel
      }}
    `);
  }
  get elementSelector() {
    return '.file-permissions-body';
  }
  getElement() {
    return find(this.elementSelector);
  }
  getPosixPermissionsEditor() {
    return this.getElement().querySelector('.posix-permissions-editor');
  }
  getAclPermissionsEditor() {
    return this.getElement().querySelector('.acl-editor');
  }

  async givenDifferentPosix() {
    this.files = await allSettled([
      this.createFile({ posixPermissions: '644' }),
      this.createFile({ posixPermissions: '777' }),
    ]);
  }
  async givenDifferentAcl() {
    const acls = await allSettled([
      this.createAcl([this.createExampleAce(0)]),
      this.createAcl([this.createExampleAce(1)]),
    ]);
    this.files = await allSettled([
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

  async whenEditAnywayIsClicked() {
    const editAnyway = findByText('Edit anyway', 'button');
    expect(editAnyway, 'edit anyway button').exists;
    await click(editAnyway);
  }

  async thenExpectVisiblePosixEditor() {
    const posixEditor = this.getPosixPermissionsEditor();
    expect(posixEditor).to.exist;
    expect(posixEditor).to.not.have.class('hidden');
  }
  async thenExpectHiddenPosixEditor() {
    const posixEditor = this.getPosixPermissionsEditor();
    expect(posixEditor).to.exist;
    expect(posixEditor).to.have.class('hidden');
  }
  async thenExpectVisibleAclEditor() {
    const aclEditor = this.getPosixPermissionsEditor();
    expect(aclEditor).to.exist;
    expect(aclEditor).to.not.have.class('hidden');
  }
}
