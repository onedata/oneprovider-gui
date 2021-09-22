import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
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
});

describe('Integration | Component | items select browser', function () {
  setupComponentTest('items-select-browser', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'fileManager', FileManager);
  });

  it('renders header, body and footer in modal', function () {
    render(this);
    expect(this.$('.items-select-browser-header')).to.exist;
    expect(this.$('.items-select-browser-body')).to.exist;
    expect(this.$('.items-select-browser-footer')).to.exist;
  });
});

function render(testCase) {
  if (!testCase.get('selectorModel')) {
    const space = {
      rootDir: promiseObject(resolve({
        name: 'Test root',
        entityId: 'test_root_dir',
        hasParent: false,
      })),
    };
    const selectorModel = FilesystemModel.create({
      ownerSource: testCase,
      constraintSpec: {
        allowedFileTypes: ['file', 'dir'],
      },
      space,
    });
    testCase.set('selectorModel', selectorModel);
  }
  testCase.render(hbs `
    {{#one-pseudo-modal as |modal|}}
      {{items-select-browser
        modal=modal
        selectorModel=selectorModel
      }}
    {{/one-pseudo-modal}}
  `);
}
