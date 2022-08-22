import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { find } from '@ember/test-helpers';
import FilePermissionsViewModel from 'oneprovider-gui/utils/file-permissions-view-model';
import { lookupService } from '../../../helpers/stub-service';

describe('Integration | Component | file-permissions/body', function () {
  setupRenderingTest();

  it('renders visible POSIX permissions editor when all files permissions are the same POSIX', async function () {
    const helper = new Helper(this);
    helper.files = [
      helper.createFile(),
      helper.createFile(),
    ];

    await helper.render();

    const posixEditor = helper.getPosixPermissionsEditor();
    expect(helper.getElement()).to.exist;
    expect(posixEditor).to.not.have.class('hidden');
  });
});

class Helper {
  /**
   * @param {Mocha.Context} context
   */
  constructor(context) {
    this.context = context;
    this.store = lookupService(this.context, 'store');
    this.space = this.store.createRecord('space', { name: 'test space' });
  }
  createFile(properties = {}) {
    return this.store.createRecord('file', {
      name: 'dummy file',
      type: 'file',
      posixPermissions: '644',
      activePermissionsType: 'posix',

      ...properties,
    });
  }
  createViewModel() {
    if (!this.files) {
      throw new Error('files in helper not implemented');
    }
    return FilePermissionsViewModel.create({
      space: this.space,
      files: this.files,
    });
  }
  async render() {
    this.context.setProperties({
      viewModel: this.createViewModel(),
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
}
