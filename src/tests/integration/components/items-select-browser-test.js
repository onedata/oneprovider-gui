import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import FilesystemModel from 'oneprovider-gui/utils/items-select-browser/filesystem-model';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { lookupService, registerService } from '../../helpers/stub-service';
import { getFileGri } from 'oneprovider-gui/models/file';

const FileManager = Service.extend(Evented, {
  async fetchDirChildren() {
    return [];
  },
  registerRefreshHandler() {},
  deregisterRefreshHandler() {},
  async getFileOwner() {},
});

describe('Integration | Component | items-select-browser', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(function () {
    registerService(this, 'fileManager', FileManager);
  });

  afterEach(function () {
    this.get('selectorModel')?.destroy();
  });

  it('renders header, body and footer in modal', async function () {
    await renderComponent(this);
    expect(find('.items-select-browser-header')).to.exist;
    expect(find('.items-select-browser-body')).to.exist;
    expect(find('.items-select-browser-footer')).to.exist;
  });
});

async function renderComponent(testCase) {
  if (!testCase.get('selectorModel')) {
    const store = lookupService(testCase, 'store');
    const rootDir = await store.createRecord('file', {
      name: 'Test root',
      id: getFileGri('test_root_dir'),
    }).save();
    const space = await store.createRecord('space', {
      rootDir,
    }).save();
    const selectorModel = FilesystemModel.create({
      ownerSource: testCase.owner,
      constraintSpec: {
        allowedFileTypes: ['file', 'dir'],
      },
      space,
    });
    testCase.set('selectorModel', selectorModel);
  }
  await render(hbs `
    {{#one-pseudo-modal as |modal|}}
      {{items-select-browser
        modal=modal
        selectorModel=selectorModel
      }}
    {{/one-pseudo-modal}}
  `);
}
