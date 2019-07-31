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
    const dateReadable = '18 May 2022 10:50';
    const file = {
      modificationTime: date,
    };
    this.set('file', file);
    this.render(hbs `{{file-browser/fb-table-row
      file=file
    }}`);
    expect(this.$('.fb-table-col-modification').text()).to.contain(dateReadable);
  });
});
