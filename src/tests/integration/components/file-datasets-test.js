import { expect } from 'chai';
import { describe, it, context, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import $ from 'jquery';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

describe('Integration | Component | file datasets', function () {
  setupComponentTest('file-datasets', {
    integration: true,
  });

  context('for single file', function () {
    beforeEach(function () {
      this.set('file', createFile({ name: 'test-file.txt' }));
    });

    it('renders file name of injected file', function () {
      this.set('file.name', 'hello world');
      render(this);
      expect($('.modal-file-subheader .file-name').text()).to.contain('hello world');
    });
  });
});

function render(testCase) {
  testCase.set('files', [testCase.get('file')]);
  testCase.render(hbs `{{#one-pseudo-modal as |modal|}}
    {{file-datasets
      modal=modal
      files=files
    }}
  {{/one-pseudo-modal}}`);
}

function createFile(override = {}, ownerGri = userGri) {
  return Object.assign({
    modificationTime: moment('2020-01-01T08:50:00+00:00').unix(),
    posixPermissions: '777',
    type: 'file',
    belongsTo(name) {
      if (name === 'owner') {
        return {
          id: () => ownerGri,
        };
      }
    },
  }, override);
}
