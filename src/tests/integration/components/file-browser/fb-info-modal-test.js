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
import OneTooltipHelper from '../../../helpers/one-tooltip';

const returnDummyUrl = () => 'https://dummy';

const RestApiGenerator = Service.extend({
  listSharedDirectoryChildren: returnDummyUrl,
  downloadSharedDirectoryContent: returnDummyUrl,
  downloadSharedFileContent: returnDummyUrl,
  getSharedFileAttributes: returnDummyUrl,
  getSharedFileJsonMetadata: returnDummyUrl,
  getSharedFileRdfMetadata: returnDummyUrl,
  getSharedFileExtendedAttributes: returnDummyUrl,
  getXRootDUrl: returnDummyUrl,
});

const urlTypeTranslations = {
  listSharedDirectoryChildren: 'List directory files and subdirectories',
  downloadSharedFileContent: 'Download file content',
  downloadSharedDirectoryContent: 'Download directory (tar)',
  getSharedFileAttributes: 'Get attributes',
  getSharedFileJsonMetadata: 'Get JSON metadata',
  getSharedFileRdfMetadata: 'Get RDF metadata',
  getSharedFileExtendedAttributes: 'Get extended attributes (xattrs)',
};

// checking only significant fragments to not duplicate whole world
const urlTypeDescriptionTranslations = {
  listSharedDirectoryChildren: 'returns the list of directory',
  downloadSharedFileContent: 'returns the binary file',
  downloadSharedDirectoryContent: 'returns a TAR archive with directory contents',
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
    registerService(this, 'restApiGenerator', RestApiGenerator);
    const fileHardlinksResult = this.set('fileHardlinksResult', {
      hardlinksCount: 1,
      hardlinks: [],
      errors: [{ id: 'forbidden' }],
    });
    sinon.stub(lookupService(this, 'file-manager'), 'getFileHardlinks')
      .resolves(fileHardlinksResult);
    this.set('getDataUrl', ({ selected: [firstSelected] }) => `link-${firstSelected}`);
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

  it('does not render symlink target path when file is not symlink', function () {
    this.set('file', {
      type: 'file',
      targetPath: 'some/path',
    });

    render(this);

    expect(this.$('.file-info-row-target-path')).to.not.exist;
  });

  it('does render symlink target relative path when file is a symlink', function () {
    this.set('file', {
      type: 'symlink',
      targetPath: 'some/path',
    });

    render(this);

    expect(this.$('.file-info-row-target-path .property-value .clipboard-input').val())
      .to.equal('some/path');
  });

  it('renders symlink target absolute path with space name when file is a symlink and space id is known',
    function () {
      this.setProperties({
        file: {
          type: 'symlink',
          targetPath: '<__onedata_space_id:space1>/some/path',
        },
        space: {
          entityId: 'space1',
          name: 'space 1',
        },
      });

      render(this);

      expect(this.$('.file-info-row-target-path .property-value .clipboard-input').val())
        .to.equal('/space 1/some/path');
    }
  );

  it('renders symlink target absolute path  with "unknown space" when file is a symlink and space id is unknown',
    function () {
      this.setProperties({
        file: {
          type: 'symlink',
          targetPath: '<__onedata_space_id:space2>/some/path',
        },
        space: {
          entityId: 'space1',
          name: 'space 1',
        },
      });

      render(this);

      expect(this.$('.file-info-row-target-path .property-value .clipboard-input').val())
        .to.equal('/<unknown space>/some/path');
    }
  );

  it('renders symlink target absolute path with "unknown space" when file is a symlink and space is not provided',
    function () {
      this.setProperties({
        file: {
          type: 'symlink',
          targetPath: '<__onedata_space_id:space1>/some/path',
        },
        space: undefined,
      });

      render(this);

      expect(this.$('.file-info-row-target-path .property-value .clipboard-input').val())
        .to.equal('/<unknown space>/some/path');
    }
  );

  it('does not show tabs when hardlinks count is 1', async function () {
    this.set('file', {
      type: 'file',
      hardlinksCount: 1,
    });

    render(this);
    await wait();

    expect(this.$('.nav-tabs')).to.not.exist;
  });

  it('shows hardlinks tab when hardlinks count is 2', async function () {
    this.set('file', {
      type: 'file',
      hardlinksCount: 2,
    });

    render(this);
    await wait();

    expect(this.$('.nav-tabs').text()).to.contain('Hard links (2)');
  });

  it('shows hardlinks list', async function () {
    this.set('file', {
      type: 'file',
      hardlinksCount: 2,
    });
    Object.assign(this.get('fileHardlinksResult'), {
      hardlinksCount: 2,
      hardlinks: [{
        entityId: 'f1',
        name: 'abc',
      }, {
        entityId: 'f2',
        name: 'def',
      }],
      errors: [],
    });

    render(this);

    await wait();
    await click(this.$('.nav-link:contains("Hard links")')[0]);

    const $fileHardlinks = this.$('.file-hardlink');
    expect($fileHardlinks).to.have.length(2);
    expect($fileHardlinks.eq(0).find('.file-name').text().trim()).to.equal('abc');
    expect($fileHardlinks.eq(0).find('.file-path').text().trim()).to.match(/Path:\s*\/abc/);
    expect($fileHardlinks.eq(0).find('.file-path a')).to.have.attr('href', 'link-f1');
    expect($fileHardlinks.eq(1).find('.file-name').text().trim()).to.equal('def');
    expect($fileHardlinks.eq(1).find('.file-path').text().trim()).to.match(/Path:\s*\/def/);
    expect($fileHardlinks.eq(1).find('.file-path a')).to.have.attr('href', 'link-f2');
    expect($fileHardlinks.find('.file-type-icon.oneicon-browser-file')).to.have.length(2);
  });

  it('shows hardlinks partial fetch error', async function () {
    this.set('file', {
      type: 'file',
      hardlinksCount: 2,
    });
    Object.assign(this.get('fileHardlinksResult'), {
      hardlinksCount: 4,
      hardlinks: [{
        entityId: 'f1',
        name: 'abc',
      }],
      errors: [{
        id: 'forbidden',
      }, {
        id: 'unauthorized',
      }, {
        id: 'forbidden',
      }],
    });

    render(this);

    await wait();
    await click(this.$('.nav-link:contains("Hard links")')[0]);

    const $fileHardlinks = this.$('.file-hardlink');
    expect($fileHardlinks).to.have.length(2);
    expect($fileHardlinks.eq(0).find('.file-name').text().trim()).to.equal('abc');
    expect($fileHardlinks.eq(1).text().trim()).to.equal('And 3 more that you cannot access.');
    const tooltipText =
      await new OneTooltipHelper($fileHardlinks.eq(1).find('.one-icon')[0]).getText();
    expect(tooltipText).to.equal(
      'Cannot load files due to error: "You are not authorized to perform this operation (insufficient privileges?)." and 1 more errors.'
    );
  });

  it('shows hardlinks full fetch error', async function () {
    this.set('file', {
      type: 'file',
      hardlinksCount: 2,
    });
    Object.assign(this.get('fileHardlinksResult'), {
      hardlinksCount: 2,
      hardlinks: [],
      errors: [{
        id: 'unauthorized',
      }, {
        id: 'unauthorized',
      }],
    });

    render(this);

    await wait();
    await click(this.$('.nav-link:contains("Hard links")')[0]);

    const $fileHardlinks = this.$('.file-hardlink');
    expect($fileHardlinks).to.have.length(1);
    expect($fileHardlinks.eq(0).text().trim())
      .to.equal('You do not have access to the hard links of this file.');
    const tooltipText =
      await new OneTooltipHelper($fileHardlinks.eq(0).find('.one-icon')[0]).getText();
    expect(tooltipText).to.equal(
      'Cannot load files due to error: "You must authenticate yourself to perform this operation.".'
    );
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
      this.set('space', { entityId: spaceEntityId });

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

    testRenderApiSection(false);
  });

  context('for directory', function () {
    beforeEach(function () {
      this.set('file', fileParent1);
    });

    testRenderApiSection(false);
  });

  context('in preview mode', function () {
    beforeEach(function () {
      this.set('previewMode', true);
      this.setProperties({
        previewMode: true,
        share: {
          id: 'op_share.1234.instance:private',
          entityId: '1234',
          hasHandle: false,
        },
      });
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

      testRenderApiSection(true);
      testRenderRestUrlTypeOptions(restUrlTypes);

      restUrlTypes.forEach(type => {
        testRenderRestUrlAndInfoForType(type);
      });

      testRenderRestUrlAndInfoForType(
        'downloadSharedFileContent',
        false,
        'shows download content REST URL and its info in hint by default'
      );
    });

    context('for directory', function () {
      beforeEach(function () {
        this.set('file', fileParent1);
      });

      const restUrlTypes = [
        'downloadSharedDirectoryContent',
        'listSharedDirectoryChildren',
        'getSharedFileAttributes',
        'getSharedFileJsonMetadata',
        'getSharedFileRdfMetadata',
        'getSharedFileExtendedAttributes',
      ];

      testRenderRestUrlTypeOptions(restUrlTypes, 'dir');

      testRenderApiSection(true);

      restUrlTypes.forEach(type => {
        testRenderRestUrlAndInfoForType(type, 'dir');
      });

      testRenderRestUrlAndInfoForType(
        'listSharedDirectoryChildren',
        false,
        'shows list children REST URL and its info in hint by default'
      );
    });
  });
});

function testRenderApiSection(renders = true) {
  const renderText = renders ? 'renders' : 'does not render';
  it(`${renderText} API section`, async function (done) {
    render(this);
    expect(this.$('.file-info-row-api-command'), 'row').to.have.length(renders ? 1 : 0);
    if (renders) {
      expect(this.$('.file-info-row-api-command .property-name'))
        .to.contain('Public API');
      expect(this.$('.api-command-type-selector-trigger'), 'selector trigger').to.exist;
      expect(this.$('.api-command-type-info-trigger'), 'info trigger').to.exist;
      expect(this.$('.api-tag-label'), 'api tag').to.exist;
    }
    done();
  });
}

function testRenderRestUrlTypeOptions(options) {
  const optionsString = options.map(option => `"${option}"`).join(', ');
  it(`renders only ${optionsString} REST URL type option(s) in selector`, async function (done) {
    render(this);
    await clickTrigger('.api-command-type-row');
    const $options = $('li.ember-power-select-option');
    checkUrlTypeOptions($options, options);
    done();
  });
}

function testRenderRestUrlAndInfoForType(type, useSelector = true, customText) {
  const text = customText ||
    `shows proper REST URL and info in hint when selected ${type} URL`;
  it(text, async function (done) {
    const methodName = type;
    const restApiGenerator = lookupService(this, 'restApiGenerator');
    const restApiGeneratorResult = 'curl -L https://stub_url';
    const restMethodStub = sinon.stub(restApiGenerator, methodName)
      .returns(restApiGeneratorResult);

    render(this);

    const typeTranslation = getUrlTypeTranslation(type);
    const typeDescriptionTranslation = getUrlTypeDescriptionTranslation(type);

    if (useSelector) {
      await selectChoose('.api-command-type-row', typeTranslation);
    } else {
      await wait();
    }

    expect(restMethodStub, methodName)
      .to.have.been.calledOnce;
    expect(restMethodStub).to.have.been.calledWith(
      sinon.match({ cdmiObjectId: this.get('file.cdmiObjectId') })
    );
    expect(
      this.$('.file-info-row-api-command .property-value .clipboard-input').val()
    ).to.equal(restApiGeneratorResult);
    await click('.api-command-type-info-trigger');
    const $popover = $('.webui-popover-api-command-type-info');
    expect($popover, 'popover').to.exist;
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
    share=share
    space=space
    selectedRestUrlType=selectedRestUrlType
    getDataUrl=getDataUrl
  }}`);
}

function getUrlTypeTranslation(type) {
  return urlTypeTranslations[type];
}

function getUrlTypeDescriptionTranslation(type) {
  return urlTypeDescriptionTranslations[type];
}

function checkUrlTypeOptions($options, urlTypes) {
  expect($options).to.have.length(urlTypes.length);
  const optionTitles = Array.from($options.find('.api-command-title'))
    .map(opt => opt.textContent.trim());
  const fullOptionsString = optionTitles.join(',');
  for (let i = 0; i < urlTypes.length; ++i) {
    expect(optionTitles, fullOptionsString)
      .to.contain(getUrlTypeTranslation(urlTypes[i]));
  }
}

function findContains(selector, text) {
  return findAll(selector).filter((e) => e.textContent.includes(text))[0];
}

// For some strange reason (not debugged yet), selectChoose fails on Bamboo.
// This is a simpler equivalent.
async function selectChoose(cssPath, value) {
  await clickTrigger(cssPath);
  const option = findContains('li.ember-power-select-option', value);
  expect(option, `dropdown item containing "${value}"`).to.exist;
  await click(option);
}
