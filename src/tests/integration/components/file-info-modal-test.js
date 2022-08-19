import { expect } from 'chai';
import { describe, it, context, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, find, findAll, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import {
  file1,
  owner1,
  exampleCdmiObjectId,
} from 'oneprovider-gui/components/dummy-file-info-modal';
import { lookupService } from '../../helpers/stub-service';
import sinon from 'sinon';
import OneTooltipHelper from '../../helpers/one-tooltip';
import { selectChoose, clickTrigger } from 'ember-power-select/test-support/helpers';
import { Promise } from 'rsvp';
import { findByText } from '../../helpers/find';

describe('Integration | Component | file info modal', function () {
  setupRenderingTest();

  const apiSamples = [{
    apiRoot: 'https://dev-onezone.default.svc.cluster.local/api/v3/onezone',
    type: 'rest',
    swaggerOperationId: 'get_test_data',
    requiresAuthorization: false,
    placeholders: {},
    path: '/test/path/to/data',
    name: 'Get test data',
    description: 'Return test data.',
    method: 'GET',
    data: null,
    followRedirects: true,
  }, {
    type: 'xrootd',
    name: 'Test xrootd command',
    description: 'Test xrootd.',
    command: ['xrdcp', '-r', 'root://root.example.com//data/test', '.'],
  }];

  const storageLocations = {
    locationsPerProvider: {
      provider: {
        locationsPerStorage: {
          storage: 'path',
        },
      },
    },
  };

  beforeEach(function () {
    const fileHardlinksResult = this.set('fileHardlinksResult', {
      hardlinksCount: 1,
      hardlinks: [],
      errors: [{ id: 'forbidden' }],
    });
    sinon.stub(lookupService(this, 'file-manager'), 'getFileHardlinks')
      .resolves(fileHardlinksResult);
    sinon.stub(lookupService(this, 'providerManager'), 'getCurrentProvider')
      .resolves({ name: 'provider', entityId: 'providerId' });
    sinon.stub(lookupService(this, 'storageManager'), 'getStorageById')
      .resolves({ name: 'storage', entityId: 'storage', provider: { name: 'provider' } });
    const getDataUrl = ({ selected: [firstSelected] }) => `link-${firstSelected}`;
    lookupService(this, 'app-proxy').callParent =
      function callParent(methodName, ...args) {
        if (methodName === 'getDataUrl') {
          return getDataUrl(...args);
        }
      };
    this.set('getDataUrl', getDataUrl);
    const storageLocationsProxy = sinon.stub().resolves(storageLocations);
    this.set('storageLocationsProxy', storageLocationsProxy);
  });

  // NOTE: context is not used for async render tests, because mocha's context is buggy

  it('renders file path asynchronously', async function () {
    const file = this.set('file', file1);
    const parent = file.parent;
    let resolveParent;
    file.parent = new Promise((resolve) => resolveParent = resolve);

    await renderComponent();

    expect(find('.loading-file-path'), 'loading-file-path').to.exist;
    resolveParent(parent);
    await settled();
    expect(find('.loading-file-path'), 'loading-file-path').to.not.exist;
    expect(
      find('.file-info-row-path .property-value .clipboard-input').value
    ).to.contain(file1.name);
  });

  it('renders owner full name asynchronously', async function () {
    const file = this.set('file', file1);
    const owner = file.owner;
    let resolveOwner;
    file.owner = new Promise((resolve) => resolveOwner = resolve);

    await renderComponent();

    expect(find('.loading-owner-full-name'), 'loading-owner-full-name').to.exist;
    resolveOwner(owner);
    await settled();
    expect(find('.loading-owner-full-name'), 'loading-owner-full-name')
      .to.not.exist;
    expect(
      find('.file-info-row-owner .property-value').textContent
    ).to.contain(owner1.fullName);
  });

  it('does not render symlink target path when file is not symlink', async function () {
    this.set('file', {
      type: 'file',
      targetPath: 'some/path',
    });

    await renderComponent();

    expect(find('.file-info-row-target-path')).to.not.exist;
  });

  it('does render symlink target relative path when file is a symlink', async function () {
    this.set('file', {
      type: 'symlink',
      targetPath: 'some/path',
    });

    await renderComponent();

    expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
      .to.equal('some/path');
  });

  it('renders symlink target absolute path with space name when file is a symlink and space id is known',
    async function () {
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

      await renderComponent();

      expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
        .to.equal('/space 1/some/path');
    }
  );

  it('renders symlink target absolute path  with "unknown space" when file is a symlink and space id is unknown',
    async function () {
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

      await renderComponent();

      expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
        .to.equal('/<unknown space>/some/path');
    }
  );

  it('renders symlink target absolute path with "unknown space" when file is a symlink and space is not provided',
    async function () {
      this.setProperties({
        file: {
          type: 'symlink',
          targetPath: '<__onedata_space_id:space1>/some/path',
        },
        space: undefined,
      });

      await renderComponent();

      expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
        .to.equal('/<unknown space>/some/path');
    }
  );

  it('does not show hardlink\'s tab when hardlinks count is 1', async function () {
    this.set('file', {
      type: 'file',
      hardlinksCount: 1,
    });

    await renderComponent();

    expect(find('.nav-tabs').textContent).to.not.contain('Hard links (1)');
  });

  it('shows hardlinks tab when hardlinks count is 2', async function () {
    this.set('file', {
      type: 'file',
      hardlinksCount: 2,
    });

    await renderComponent();

    expect(find('.nav-tabs').textContent).to.contain('Hard links (2)');
  });

  it('shows api sample tab when previewMode is true', async function () {
    this.set('file', {
      type: 'file',
    });
    this.set('previewMode', true);

    await renderComponent();
    expect(find('.nav-tabs').textContent).to.contain('API');
  });

  it('does not show api sample tab when file type is symlink', async function () {
    this.set('file', {
      type: 'symlink',
    });
    this.set('previewMode', true);

    await renderComponent();

    expect(find('.nav-tabs').textContent).to.not.contain('API');
  });

  it('does not show api sample tab when previewMode is false', async function () {
    this.set('file', {
      type: 'file',
    });
    this.set('previewMode', false);

    await renderComponent();

    expect(find('.nav-tabs').textContent).to.not.contain('API');
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

    await renderComponent();

    await click(findByText('Hard links', '.nav-link'));

    const fileHardlinks = findAll('.file-hardlink');
    expect(fileHardlinks).to.have.length(2);
    expect(fileHardlinks[0].querySelector('.file-name')).to.have.trimmed.text('abc');
    expect(fileHardlinks[0].querySelector('.file-path').textContent)
      .to.match(/Path:\s*\/\s*abc/);
    expect(fileHardlinks[0].querySelector('.file-path a')).to.exist;
    expect(fileHardlinks[0].querySelector('.file-path a'))
      .to.have.attr('href', 'link-f1');
    expect(fileHardlinks[1].querySelector('.file-name')).to.have.trimmed.text('def');
    expect(fileHardlinks[1].querySelector('.file-path').textContent)
      .to.match(/Path:\s*\/\s*def/);
    expect(fileHardlinks[1].querySelector('.file-path a'))
      .to.have.attr('href', 'link-f2');
    expect(findAll('.file-hardlink .file-type-icon.oneicon-browser-file'))
      .to.have.length(2);
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

    await renderComponent();

    await click(findByText('Hard links', '.nav-link'));

    const fileHardlinks = findAll('.file-hardlink');
    expect(fileHardlinks).to.have.length(2);
    expect(fileHardlinks[0].querySelector('.file-name')).to.have.trimmed.text('abc');
    expect(fileHardlinks[1]).to.have.trimmed.text('And 3 more that you cannot access.');
    const tooltipText =
      await new OneTooltipHelper(fileHardlinks[1].querySelector('.one-icon')).getText();
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

    await renderComponent();

    await click(findByText('Hard links', '.nav-link'));

    const fileHardlinks = findAll('.file-hardlink');
    expect(fileHardlinks).to.have.length(1);
    expect(fileHardlinks[0])
      .to.have.trimmed.text('You do not have access to the hard links of this file.');
    const tooltipText =
      await new OneTooltipHelper(fileHardlinks[0].querySelector('.one-icon')).getText();
    expect(tooltipText).to.equal(
      'Cannot load files due to error: "You must authenticate yourself to perform this operation.".'
    );
  });

  it('renders size of file', async function () {
    this.set('file', Object.assign({}, file1, { size: Math.pow(1024, 3) }));

    await renderComponent();

    expect(
      find('.file-info-row-size .property-value').textContent
    ).to.contain('1 GiB');
  });

  it('renders name for file', async function () {
    givenDummyFile(this);

    await renderComponent();

    expect(
      find('.file-info-row-name .property-value .clipboard-input').value
    ).to.contain(this.get('file.name'));
  });

  it('renders space id', async function () {
    givenDummyFile(this);
    const spaceEntityId = 's893y37439';
    this.set('space', { entityId: spaceEntityId });

    await renderComponent();

    expect(
      find('.file-info-row-space-id .property-value .clipboard-input').value
    ).to.contain(spaceEntityId);
  });

  it('renders cdmi object id for file', async function () {
    givenDummyFile(this);

    await renderComponent();

    expect(
      find('.file-info-row-cdmi-object-id .property-value .clipboard-input')
      .value
    ).to.contain(exampleCdmiObjectId);
  });

  it('has active "Metadata" tab and renders metadata view body when initialTab = metadata is given',
    async function () {
      givenDummyFile(this);
      this.set('initialTab', 'metadata');

      await renderComponent();

      const metadataNav = find('.nav-link-metadata');
      expect(metadataNav).to.exist;
      expect(metadataNav).to.have.class('active');
      expect(metadataNav).to.have.trimmed.text('Metadata');
      expect(find('.modal-body .file-metadata-body')).to.exist;
    }
  );

  context('for file type and API samples tab', function () {
    beforeEach(async function () {
      const fileApiSamples =
        sinon.stub(lookupService(this, 'fileManager'), 'getFileApiSamples')
        .resolves(apiSamples);
      this.setProperties({
        file: { type: 'file' },
        previewMode: true,
        fileApiSamples,
      });
      await renderComponent();
      await click(findByText('API', '.nav-link'));
    });

    it('shows API operations provided by fileManager', async function (done) {
      await clickTrigger('.api-operation-row');
      const options = findAll('li.ember-power-select-option');
      expect(options).to.have.length(2);
      const optionTitles = options
        .map(opt => opt.querySelector('.api-command-title').textContent.trim());
      const fullOptionsString = optionTitles.join(',');
      expect(fullOptionsString).to.contain('Get test data');
      expect(fullOptionsString).to.contain('Test xrootd command');
      done();
    });

    it('shows type, description and clipboard for selected REST operation', async function (done) {
      await selectChoose('.api-operation-row', 'Get test data');
      expect(find('.item-info-row-type-api-command .api-tag-label'))
        .to.contain.text('REST');
      expect(find('.item-info-row-description .description-value'))
        .to.contain.text('Return test data.');
      expect(find('.item-info-row-api-command .clipboard-input'))
        .to.contain.text(
          'curl -L -X GET \'https://dev-onezone.default.svc.cluster.local/api/v3/onezone/test/path/to/data\''
        );
      done();
    });

    it('shows type, description and clipboard for selected xrootd operation',
      async function (done) {
        await selectChoose('.api-operation-row', 'Test xrootd command');
        expect(find('.item-info-row-type-api-command .api-tag-label'))
          .to.contain.text('XRootD');
        expect(find('.item-info-row-description .description-value'))
          .to.contain.text('Test xrootd.');
        expect(find('.item-info-row-api-command .clipboard-input'))
          .to.contain.text('xrdcp -r \'root://root.example.com//data/test\' \'.\'');
        done();
      });
  });
});

async function renderComponent() {
  await render(hbs `{{file-info-modal
    open=true
    file=file
    initialTab=initialTab
    previewMode=previewMode
    share=share
    space=space
    selectedRestUrlType=selectedRestUrlType
    getDataUrl=getDataUrl
    storageLocationsProxy = storageLocationsProxy
  }}`);
}

function givenDummyFile(testCase) {
  testCase.set('file', file1);
}