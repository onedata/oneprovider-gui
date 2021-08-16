import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import FilesystemModel from 'oneprovider-gui/utils/items-select-browser/filesystem-model';

describe('Integration | Component | items select browser', function () {
  setupComponentTest('items-select-browser', {
    integration: true,
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
    const space = {};
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
