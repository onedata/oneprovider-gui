import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import FilesystemModel from 'oneprovider-gui/utils/items-select-browser/filesystem-model';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { registerService } from '../../helpers/stub-service';

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
    const space = {
      rootDir: promiseObject(resolve({
        name: 'Test root',
        entityId: 'test_root_dir',
        hasParent: false,
      })),
    };
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
