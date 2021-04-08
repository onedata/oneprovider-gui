import { expect } from 'chai';
import { describe, it, context, beforeEach } from 'mocha';
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
import { click, findAll } from 'ember-native-dom-helpers';
import { clickTrigger } from '../../../helpers/ember-power-select';
import $ from 'jquery';

const returnDummyUrl = () => 'https://dummy';

const RestGenerator = Service.extend({
  listSharedDirectoryChildren: returnDummyUrl,
  downloadSharedFileContent: returnDummyUrl,
  getSharedFileAttributes: returnDummyUrl,
  getSharedFileJsonMetadata: returnDummyUrl,
  getSharedFileRdfMetadata: returnDummyUrl,
  getSharedFileExtendedAttributes: returnDummyUrl,
});

const urlTypeTranslations = {
  listSharedDirectoryChildren: 'List directory files and subdirectories',
  downloadSharedFileContent: {
    file: 'Download file content',
    dir: 'Download directory (tar.gz)',
  },
  getSharedFileAttributes: 'Get attributes',
  getSharedFileJsonMetadata: 'Get JSON metadata',
  getSharedFileRdfMetadata: 'Get RDF metadata',
  getSharedFileExtendedAttributes: 'Get extended attributes (xattrs)',
};

// checking only significant fragments to not duplicate whole world
const urlTypeDescriptionTranslations = {
  listSharedDirectoryChildren: 'returns the list of directory',
  downloadSharedFileContent: {
    file: 'returns the binary file',
    dir: 'returns the binary directory content compressed as tar.gz',
  },
  getSharedFileAttributes: 'returns basic attributes',
  getSharedFileJsonMetadata: 'returns custom JSON',
  getSharedFileRdfMetadata: 'returns custom RDF',
  getSharedFileExtendedAttributes: 'returns custom extended',
};

describe('Integration | Component | file browser/fb info modal', function () {
  setupComponentTest('file-browser/fb-info-modal', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'restGenerator', RestGenerator);
  });

  // NOTE: context is not used for async render tests, because mocha's context is buggy

  it('renders file path asynchronously', async function (done) {
    this.set('file', file1);

    render(this);

    expect(this.$('.loading-file-path'), 'loading-file-path').to.exist;
    await wait();
    expect(this.$('.loading-file-path'), 'loading-file-path').to.not.exist;
    expect(
      this.$('.file-info-row-path .property-value .clipboard-input').val()
    ).to.contain(file1.name);

    done();
  });

  it('renders owner full name asynchronously', async function (done) {
    this.set('file', file1);

    render(this);

    expect(this.$('.loading-owner-full-name'), 'loading-owner-full-name').to.exist;
    await wait();
    expect(this.$('.loading-owner-full-name'), 'loading-owner-full-name')
      .to.not.exist;
    expect(
      this.$('.file-info-row-owner .property-value').text()
    ).to.contain(owner1.fullName);

    done();
  });

  context('for file', function () {
    beforeEach(function () {
      this.set('file', file1);
    });

    it('renders size', async function (done) {
      this.set('file', Object.assign({}, file1, { size: Math.pow(1024, 3) }));

      render(this);
      await wait();

      expect(
        this.$('.file-info-row-size .property-value').text()
      ).to.contain('1 GiB');
      done();
    });

    it('renders name', async function (done) {
      render(this);
      await wait();

      expect(
        this.$('.file-info-row-name .property-value .clipboard-input').val()
      ).to.contain(this.get('file.name'));

      done();
    });

    it('renders space id', async function (done) {
      const spaceEntityId = 's893y37439';
      this.set('spaceEntityId', spaceEntityId);

      render(this);

      expect(
        this.$('.file-info-row-space-id .property-value .clipboard-input').val()
      ).to.contain(spaceEntityId);

      done();
    });

    it('renders cdmi object id', async function (done) {
      render(this);

      expect(
        this.$('.file-info-row-cdmi-object-id .property-value .clipboard-input')
        .val()
      ).to.contain(exampleCdmiObjectId);

      done();
    });

    testRenderRestUrl(false);
  });

  context('for directory', function () {
    beforeEach(function () {
      this.set('file', fileParent1);
    });

    testRenderRestUrl(false);
  });

  context('in preview mode', function () {
    beforeEach(function () {
      this.set('previewMode', true);
    });

    context('for file', function () {
      beforeEach(function () {
        this.set('file', file1);
      });

      const restUrlTypes = [
        'downloadSharedFileContent',
        'getSharedFileAttributes',
        'getSharedFileJsonMetadata',
        'getSharedFileRdfMetadata',
        'getSharedFileExtendedAttributes',
      ];

      testRenderRestUrl(true);
      testRenderRestUrlTypeOptions(restUrlTypes, 'file');

      restUrlTypes.forEach(type => {
        testRenderRestUrlAndInfoForType(type, 'file');
      });

      testRenderRestUrlAndInfoForType(
        'downloadSharedFileContent',
        'file',
        false,
        'shows download content REST URL and its info in hint by default'
      );
    });

    context('for directory', function () {
      beforeEach(function () {
        this.set('file', fileParent1);
      });

      const restUrlTypes = [
        'listSharedDirectoryChildren',
        'downloadSharedFileContent',
        'getSharedFileAttributes',
        'getSharedFileJsonMetadata',
        'getSharedFileRdfMetadata',
        'getSharedFileExtendedAttributes',
      ];

      testRenderRestUrlTypeOptions(restUrlTypes, 'dir');

      testRenderRestUrl(true);

      restUrlTypes.forEach(type => {
        testRenderRestUrlAndInfoForType(type, 'dir');
      });

      testRenderRestUrlAndInfoForType(
        'listSharedDirectoryChildren',
        'dir',
        false,
        'shows list children REST URL and its info in hint by default'
      );
    });
  });
});

function testRenderRestUrl(renders = true) {
  const renderText = renders ? 'renders' : 'does not render';
  it(`${renderText} REST section`, async function (done) {
    render(this);
    expect(this.$('.file-info-row-rest-url')).to.have.length(renders ? 1 : 0);
    if (renders) {
      expect(this.$('.file-info-row-rest-url .property-name'))
        .to.contain('Public REST endpoint');
      expect(this.$('.rest-url-type-selector-trigger')).to.exist;
      expect(this.$('.rest-url-type-info-trigger')).to.exist;
      expect(this.$('.rest-tag-label')).to.exist;
    }
    done();
  });
}

function testRenderRestUrlTypeOptions(options, fileType) {
  const optionsString = options.map(option => `"${option}"`).join(', ');
  it(`renders only ${optionsString} REST URL type option(s) in selector`, async function (done) {
    render(this);
    await clickTrigger('.rest-url-type-row');
    const $options = $('li.ember-power-select-option');
    checkUrlTypeOptions($options, options, fileType);
    done();
  });
}

function testRenderRestUrlAndInfoForType(type, fileType, useSelector = true, customText) {
  const text = customText ||
    `shows proper REST URL and info in hint when selected ${type} URL`;
  it(text, async function (done) {
    const methodName = type;
    const restGenerator = lookupService(this, 'restGenerator');
    const restGeneratorResult = 'curl -L https://stub_url';
    const restMethodStub = sinon.stub(restGenerator, methodName)
      .returns(restGeneratorResult);

    render(this);

    const typeTranslation = getUrlTypeTranslation(type, fileType);

    const typeDescriptionTranslation = getUrlTypeDescriptionTranslation(type, fileType);

    if (useSelector) {
      await selectChoose('.rest-url-type-row', typeTranslation);
    } else {
      await wait();
    }

    expect(restMethodStub)
      .to.have.been.calledOnce;
    expect(restMethodStub)
      .to.have.been.calledWith(this.get('file.cdmiObjectId'));
    expect(
      this.$('.file-info-row-rest-url .property-value .clipboard-input').val()
    ).to.equal(restGeneratorResult);
    await click('.rest-url-type-info-trigger');
    const $popover = $('.webui-popover-rest-url-type-info');
    expect($popover).to.exist;
    expect($popover).to.have.class('in');
    expect($popover.text()).to.contain(typeDescriptionTranslation);
    const $apiDocLink = $popover.find('.documentation-link');
    expect($apiDocLink).to.have.length(1);
    expect($apiDocLink.attr('href')).to.match(/.*?\/latest\/.*?operation\/get_shared_data/);
    done();
  });
}

function render(testCase) {
  testCase.render(hbs `{{file-browser/fb-info-modal
    open=true
    file=file
    previewMode=previewMode
    spaceEntityId=spaceEntityId
    selectedRestUrlType=selectedRestUrlType
  }}`);
}

function getUrlTypeTranslation(type, fileType) {
  return type === 'downloadSharedFileContent' ?
    urlTypeTranslations.downloadSharedFileContent[fileType] :
    urlTypeTranslations[type];
}

function getUrlTypeDescriptionTranslation(type, fileType) {
  return type === 'downloadSharedFileContent' ?
    urlTypeDescriptionTranslations.downloadSharedFileContent[fileType] :
    urlTypeDescriptionTranslations[type];
}

function checkUrlTypeOptions($options, urlTypes, fileType) {
  expect($options).to.have.length(urlTypes.length);
  const optionTexts = Array.from($options).map(opt => opt.textContent.trim());
  for (let i = 0; i < urlTypes.length; ++i) {
    expect(optionTexts, optionTexts.join(','))
      .to.contain(getUrlTypeTranslation(urlTypes[i], fileType));
  }
}

function findContains(selector, text) {
  return findAll(selector).filter((e) => e.textContent.trim().indexOf(text) > -1)[0];
}

// For some strange reason (not debugged yet), selectChoose fails on Bamboo.
// This is a simpler equivalent.
async function selectChoose(cssPath, value) {
  await clickTrigger(cssPath);
  const option = findContains('li.ember-power-select-option', value);
  expect(option, `dropdown item containing "${value}"`).to.exist;
  await click(option);
}
