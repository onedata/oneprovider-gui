import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import {
  file1,
  owner1,
  exampleCdmiObjectId,
} from 'oneprovider-gui/components/dummy-file-info';
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

    expect(
      this.$('.file-info-row-name .property-value .clipboard-input').val()
    ).to.contain(file1.name);
  });

  it('renders file path asynchronously', function () {
    this.set('file1', file1);

    this.render(hbs `{{file-browser/fb-info-modal
      open=true
      file=file1
    }}`);

    expect(this.$('.loading-file-path'), 'loading-file-path').to.exist;
    return wait()
      .then(() => {
        expect(this.$('.loading-file-path'), 'loading-file-path').to.not.exist;
        expect(
          this.$('.file-info-row-path .property-value .clipboard-input').val()
        ).to.contain(file1.name);
      });
  });

  it('renders owner full name asynchronously', function () {
    this.set('file1', file1);

    this.render(hbs `{{file-browser/fb-info-modal
      open=true
      file=file1
    }}`);

    expect(this.$('.loading-owner-full-name'), 'loading-owner-full-name').to.exist;
    return wait()
      .then(() => {
        expect(this.$('.loading-owner-full-name'), 'loading-owner-full-name')
          .to.not.exist;
        expect(
          this.$('.file-info-row-owner .property-value').text()
        ).to.contain(owner1.fullName);
      });
  });

  it('renders space id', function () {
    const spaceEntityId = 's893y37439';
    this.setProperties({
      file1,
      spaceEntityId,
    });

    this.render(hbs `{{file-browser/fb-info-modal
      open=true
      file=file1
      spaceEntityId=spaceEntityId
    }}`);

    expect(
      this.$('.file-info-row-space-id .property-value .clipboard-input').val()
    ).to.contain(spaceEntityId);
  });

  it('renders cdmi object id', function () {
    this.set('file1', file1);

    this.render(hbs `{{file-browser/fb-info-modal
      open=true
      file=file1
    }}`);

    expect(
      this.$('.file-info-row-cdmi-object-id .property-value .clipboard-input')
      .val()
    ).to.contain(exampleCdmiObjectId);
  });

  it('renders file size', function () {
    this.set('file1', Object.assign({}, file1, { size: Math.pow(1024, 3) }));

    this.render(hbs `{{file-browser/fb-info-modal
      open=true
      file=file1
    }}`);

    expect(
      this.$('.file-info-row-size .property-value').text()
    ).to.contain('1 GiB');
  });
});
