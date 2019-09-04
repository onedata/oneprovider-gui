import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import { file1 } from 'oneprovider-gui/components/dummy-file-info';
import wait from 'ember-test-helpers/wait';

describe('Integration | Component | file browser/fb info modal', function () {
  setupComponentTest('file-browser/fb-info-modal', {
    integration: true,
  });

  it('renders file name', function () {
    this.set('file1', file1);

    this.render(hbs `{{file-browser/fb-info-modal
      open=true
      file=file1
    }}`);

    return wait().then(() => {
      expect(this.$('.file-info-row-name .property-value').text())
        .to.contain(file1.name);
    });
  });
});
