import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import {
  file1,
  fileParent1,
  owner1,
  exampleCdmiObjectId,
} from 'oneprovider-gui/components/dummy-file-info';
import { registerService, lookupService } from '../../../helpers/stub-service';
import wait from 'ember-test-helpers/wait';
import Service from '@ember/service';
import sinon from 'sinon';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { get } from '@ember/object';

const listSharedDirectoryChildrenRest = 'https://example.com/list-children-rest';
const downloadSharedFileContentRest = 'https://example.com/download-file-content-rest';

const RestGenerator = Service.extend({
  listSharedDirectoryChildren: notImplementedThrow,
  downloadSharedFileContent: notImplementedThrow,
});

describe('Integration | Component | file browser/fb info modal', function () {
  setupComponentTest('file-browser/fb-info-modal', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'restGenerator', RestGenerator);
    const restGenerator = lookupService(this, 'restGenerator');
    sinon.stub(restGenerator, 'listSharedDirectoryChildren').returns(listSharedDirectoryChildrenRest);
    sinon.stub(restGenerator, 'downloadSharedFileContent').returns(downloadSharedFileContentRest);
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

  [true, false].forEach(isPreviewMode => {
    ['file', 'dir'].forEach(fileType => {
      testRenderRestUrlForTypeInMode(fileType, isPreviewMode);
    });
  });

});

function testRenderRestUrlForTypeInMode(fileType, isPreviewMode) {
  const isRenderingText = isPreviewMode ? 'renders' : 'does not render';
  const modeText = isPreviewMode ? 'preview' : 'non-preview';
  const isDir = fileType === 'dir';
  it(`${isRenderingText} ${fileType} REST URL in ${modeText} mode when item is a ${fileType}`, async function () {
    const file = isDir ? fileParent1 : file1;
    this.setProperties({
      file,
      previewMode: isPreviewMode,
    });

    this.render(hbs `{{file-browser/fb-info-modal
      open=true
      file=file
      previewMode=previewMode
    }}`);

    if (isPreviewMode) {
      const methodName = isDir ? 'listSharedDirectoryChildren' : 'downloadSharedFileContent';
      expect(get(lookupService(this, 'restGenerator'), methodName))
        .to.have.been.calledWith(get(file, 'cdmiObjectId'));
      expect(this.$(
        '.file-info-row-rest-url .property-name')).to.contain('REST URL');
      expect(
        this.$('.file-info-row-rest-url .property-value .clipboard-input').val()
      ).to.equal(isDir ? listSharedDirectoryChildrenRest : downloadSharedFileContentRest);
    } else {
      expect(this.$('.file-info-row-rest-url')).to.not.exist;
    }
  });
}
