import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';

describe('Integration | Component | file browser/fb table row', function () {
  setupComponentTest('file-browser/fb-table-row', {
    integration: true,
  });

  it('renders modification date', function () {
    const date = moment('2022-05-18T08:50:00+00:00').unix();
    const dateReadable = /18 May 2022 \d+:50/;
    const file = {
      modificationTime: date,
      posixPermissions: '777',
      type: 'file',
      belongsTo(name) {
        if (name === 'owner') {
          return {
            id: () => 'op_space.dummy.instance:private',
          };
        }
      },
    };
    this.set('file', file);
    this.render(hbs `{{file-browser/fb-table-row
      file=file
    }}`);
    expect(this.$('.fb-table-col-modification').text()).to.match(dateReadable);
  });
});
