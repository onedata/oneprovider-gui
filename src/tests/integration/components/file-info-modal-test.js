import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, find, findAll, settled } from '@ember/test-helpers';
import { get, defineProperty, computed } from '@ember/object';
import { hbs } from 'ember-cli-htmlbars';
import { lookupService } from '../../helpers/stub-service';
import sinon from 'sinon';
import OneTooltipHelper from '../../helpers/one-tooltip';
import { selectChoose, clickTrigger } from 'ember-power-select/test-support/helpers';
import { Promise } from 'rsvp';
import { findByText } from '../../helpers/find';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { entityType as spaceEntityType } from 'oneprovider-gui/models/space';
import FileDistributionHelper from '../../helpers/file-distribution';
import createSpace from '../../helpers/create-space';
import DefaultUser from '../../helpers/default-user';
import globals from 'onedata-gui-common/utils/globals';
import FilesystemBrowserModel from 'oneprovider-gui/utils/filesystem-browser-model';

const storageLocations = {
  locationsPerProvider: {
    provider: {
      locationsPerStorage: {
        storage: 'path',
      },
    },
  },
};

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

const owner1 = {
  fullName: 'John Smith',
};

const exampleCdmiObjectId =
  '0000000000466F8867756964233666396333666230366265366163353530343634616537383831306430656662233732333065663438326234333936376463373332313734373435306535363134';

describe('Integration | Component | file-info-modal', function () {
  const { afterEach } = setupRenderingTest();

  beforeEach(async function () {
    this.fileParentRoot = await createFile(this, {
      name: 'My space',
      type: 'dir',
    });

    this.fileParent3 = await createFile(this, {
      name: 'First',
      parent: this.fileParentRoot,
      type: 'dir',
    });

    this.fileParent2 = await createFile(this, {
      name: 'Second directory',
      parent: this.fileParent3,
      type: 'dir',
    });

    this.fileParent1 = await createFile(this, {
      name: 'Third one',
      parent: this.fileParent2,
      type: 'dir',
      cdmiObjectId: exampleCdmiObjectId,
      mtime: Math.floor(Date.now() / 1000),
      owner: owner1,
    });

    this.file1 = await createFile(this, {
      name: 'Onedata.txt',
      size: 1.5 * Math.pow(1024, 2),
      parent: this.fileParent1,
      type: 'file',
      cdmiObjectId: exampleCdmiObjectId,
      mtime: Math.floor(Date.now() / 1000),
      owner: owner1,
      posixPermissions: '644',
      activePermissionsType: 'posix',
      storageLocations,
    });
  });

  afterEach(function () {
    this.browserModel?.destroy?.();
  });

  // NOTE: context is not used for async render tests, because mocha's context is buggy

  it('renders file path asynchronously', async function () {
    await givenDefaultStubs(this);
    let resolveParent;
    defineProperty(this.get('file'), 'parent', computed(function () {
      return new Promise((resolve) => resolveParent = resolve);
    }));

    await renderComponent();

    expect(find('.loading-file-path'), 'loading-file-path').to.exist;
    resolveParent(this.parent1);
    await settled();
    expect(find('.loading-file-path'), 'loading-file-path').to.not.exist;
    expect(
      find('.file-info-row-path .property-value .clipboard-input').value
    ).to.contain(get(this.get('file'), 'name'));
  });

  it('renders owner full name asynchronously', async function () {
    await givenDefaultStubs(this);
    const store = lookupService(this, 'store');
    const defaultUserHelper = new DefaultUser(this);
    const owner = await defaultUserHelper.getDefaultUser('user_id', {
      fullName: 'Hello Worlder',
    });
    const file = await store.createRecord('file', {
      name: 'Onedata.txt',
      type: 'file',
      owner,
    }).save();
    this.set('file', file);
    const fileManager = lookupService(this, 'fileManager');
    const getFileOwner = sinon.stub(fileManager, 'getFileOwner');
    let resolveOwner;
    getFileOwner.withArgs(file).callsFake(() => {
      return new Promise((resolve) => resolveOwner = resolve);
    });

    await renderComponent();

    expect(find('.loading-owner-full-name'), 'loading-owner-full-name').to.exist;
    resolveOwner(owner);
    await settled();
    expect(find('.loading-owner-full-name'), 'loading-owner-full-name')
      .to.not.exist;
    expect(
      find('.file-info-row-owner .property-value').textContent
    ).to.contain(get(owner, 'fullName'));
  });

  it('does not render symlink target path when file is not symlink', async function () {
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
      symlinkValue: 'some/path',
    });

    await renderComponent();

    expect(find('.file-info-row-target-path')).to.not.exist;
  });

  it('does render symlink target relative path when file is a symlink', async function () {
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'symlink',
      symlinkValue: 'some/path',
    });

    await renderComponent();

    expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
      .to.equal('some/path');
  });

  it('renders symlink target absolute path with space name when file is a symlink and space id is known',
    async function () {
      await givenDefaultStubs(this);
      this.get('file').setProperties({
        type: 'symlink',
        symlinkValue: '<__onedata_space_id:space1>/some/path',
      });
      this.setProperties({
        space: await createSpaceModel(this, {
          id: gri({
            entityType: spaceEntityType,
            entityId: 'space1',
            aspect: 'instance',
          }),
          name: 'space 1',
        }),
      });

      await renderComponent();

      expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
        .to.equal('/space 1/some/path');
    }
  );

  it('renders symlink target absolute path  with "unknown space" when file is a symlink and space id is unknown',
    async function () {
      await givenDefaultStubs(this);
      this.get('file').setProperties({
        type: 'symlink',
        symlinkValue: '<__onedata_space_id:space2>/some/path',
      });
      this.setProperties({
        space: await createSpaceModel(this, {
          id: gri({
            entityType: spaceEntityType,
            entityId: 'space1',
            aspect: 'instance',
          }),
          name: 'space 1',
        }),
      });

      await renderComponent();

      expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
        .to.equal('/<unknown space>/some/path');
    }
  );

  it('renders symlink target absolute path with "unknown space" when file is a symlink and space is not provided',
    async function () {
      await givenDefaultStubs(this);
      this.get('file').setProperties({
        type: 'symlink',
        symlinkValue: '<__onedata_space_id:space1>/some/path',
      });
      this.setProperties({
        space: undefined,
        previewMode: true,
      });

      await renderComponent();

      expect(find('.file-info-row-target-path .property-value .clipboard-input').value)
        .to.equal('/<unknown space>/some/path');
    }
  );

  it('does not show hardlink\'s tab when hardlinks count is 1', async function () {
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
      hardlinkCount: 1,
    });

    await renderComponent();

    expect(find('.nav-tabs').textContent).to.not.contain('Hard links (1)');
  });

  it('shows hardlinks tab when hardlinks count is 2', async function () {
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
      hardlinkCount: 2,
    });

    await renderComponent();

    expect(find('.nav-tabs').textContent).to.match(/Hard links\s+2/);
  });

  it('shows api sample tab when previewMode is true', async function () {
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
    });
    this.setProperties({
      previewMode: true,
    });

    await renderComponent();
    expect(find('.nav-tabs').textContent).to.contain('API');
  });

  it('does not show api sample tab when file type is symlink', async function () {
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'symlink',
    });
    this.setProperties({
      previewMode: true,
    });

    await renderComponent();

    expect(find('.nav-tabs').textContent).to.not.contain('API');
  });

  it('shows hardlinks list', async function () {
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
      hardlinkCount: 2,
    });
    Object.assign(this.get('fileHardlinksResult'), {
      hardlinkCount: 2,
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
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
      hardlinkCount: 2,
    });
    Object.assign(this.get('fileHardlinksResult'), {
      hardlinkCount: 4,
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
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
      hardlinkCount: 2,
    });
    Object.assign(this.get('fileHardlinksResult'), {
      hardlinkCount: 2,
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
    await givenDefaultStubs(this);
    this.get('file').setProperties({
      type: 'file',
      hardlinkCount: 2,
      size: Math.pow(1024, 3),
    });

    await renderComponent();

    expect(
      find('.file-info-row-size .property-value').textContent
    ).to.contain('1 GiB');
  });

  it('renders name for file', async function () {
    await givenDefaultStubs(this);
    await givenDummyFile(this);

    await renderComponent();

    expect(
      find('.file-info-row-name .property-value .clipboard-input').value
    ).to.contain(this.get('files.0.name'));
  });

  it('renders space id', async function () {
    await givenDefaultStubs(this);
    await givenDummyFile(this);
    const spaceEntityId = 's893y37439';
    const space = await createSpaceModel(this, {
      id: gri({
        entityType: spaceEntityType,
        entityId: spaceEntityId,
        aspect: 'instance',
      }),
      name: 'space 1',
    });
    this.set('space', space);

    await renderComponent();

    expect(
      find('.file-info-row-space-id .property-value .clipboard-input').value
    ).to.contain(spaceEntityId);
  });

  it('renders cdmi object id for file', async function () {
    await givenDefaultStubs(this);
    await givenDummyFile(this);

    await renderComponent();

    expect(
      find('.file-info-row-cdmi-object-id .property-value .clipboard-input')
      .value
    ).to.contain(exampleCdmiObjectId);
  });

  it('has active "Metadata" tab and renders metadata view body when initialTab = metadata is given',
    async function () {
      await givenDefaultStubs(this);
      await givenDummyFile(this);
      this.set('initialTab', 'metadata');

      await renderComponent();

      const metadataNav = find('.nav-link-metadata');
      expect(metadataNav).to.exist;
      expect(metadataNav).to.have.class('active');
      expect(metadataNav).to.have.trimmed.text('Metadata');
      expect(find('.modal-body .file-metadata-body')).to.exist;
    }
  );

  it('has active "Permissions" tab and renders permissions view body when initialTab = permissions is given',
    async function () {
      await givenDefaultStubs(this);
      await givenDummyFile(this);
      this.set('initialTab', 'permissions');

      await renderComponent();

      const permissionsNav = find('.nav-link-permissions');
      expect(permissionsNav).to.exist;
      expect(permissionsNav).to.have.class('active');
      expect(permissionsNav).to.have.trimmed.text('Permissions');
      expect(find('.modal-body .file-permissions-body')).to.exist;
    }
  );

  it('has active "Shares" tab and renders shares view body when initialTab = shares is given',
    async function () {
      await givenDefaultStubs(this);
      await givenFileModel(this, {
        sharesCount: 0,
      });
      this.set('initialTab', 'shares');

      await renderComponent();

      const sharesNav = find('.nav-link-shares');
      expect(sharesNav).to.exist;
      expect(sharesNav).to.have.class('active');
      expect(sharesNav).to.have.trimmed.text('Shares');
      expect(find('.modal-body .file-shares-body')).to.exist;
    }
  );

  it('renders "Shares" tab with number of shares in tab name', async function () {
    await givenDefaultStubs(this);
    await givenFileModel(this, {
      sharesCount: 2,
    });

    await renderComponent();

    const sharesNav = find('.nav-link-shares');
    expect(sharesNav).to.exist;
    expect(sharesNav.textContent).to.match(/Shares\s+2/);
  });

  it('has active "QoS" tab and renders QoS view body when initialTab = qos is given',
    async function () {
      await givenDefaultStubs(this);
      givenEmptyTabOptions(this);
      await givenDummySpace(this, {
        currentUserEffPrivileges: ['space_view_qos'],
      });
      await givenFileModelWithQos(this);
      this.set('initialTab', 'qos');

      await renderComponent();

      const qosNav = find('.nav-link-qos');
      expect(qosNav).to.exist;
      expect(qosNav).to.have.class('active');
      expect(qosNav).to.have.trimmed.text('QoS');
      expect(find('.modal-body .file-qos-body')).to.exist;
    }
  );

  it('has active "Distribution" tab and renders distribution view body when initialTab = distribution is given',
    async function () {
      let fileDistributionHelper;
      try {
        fileDistributionHelper = new FileDistributionHelper(this);
        await fileDistributionHelper.givenSingleFileWithDistribution();
        fileDistributionHelper.givenNoTransfersForSingleFile();
        this.setProperties({
          tabOptions: {
            qos: {
              isVisible: false,
            },
            shares: {
              isVisible: false,
            },
          },
          initialTab: 'distribution',
          space: fileDistributionHelper.space,
          files: fileDistributionHelper.files,
        });

        await renderComponent();

        const sharesNav = find('.nav-link-distribution');
        expect(sharesNav).to.exist;
        expect(sharesNav).to.have.class('active');
        expect(sharesNav).to.have.trimmed.text('Distribution');
        expect(find('.modal-body .file-distribution-body')).to.exist;
      } finally {
        fileDistributionHelper.destroy();
      }
    }
  );

  it('has "Details" header and item names in subheader for multiple files',
    async function () {
      await givenDefaultStubs(this);
      await givenMultipleFileModels(this, [{
          name: 'foo.txt',
          type: 'file',
        },
        {
          name: 'bar.txt',
          type: 'file',
        },
        {
          name: 'hello',
          type: 'dir',
        },
        {
          name: 'world',
          type: 'dir',
        },
      ]);

      await renderComponent();

      const modalHeader = find('.file-info-modal-header');
      const header = modalHeader.querySelector('h1');
      expect(header).to.exist;
      expect(header).to.have.trimmed.text('Details');
      const subheader = modalHeader.querySelector('h2');
      expect(subheader).to.exist;
      expect(subheader)
        .to.contain.text('foo.txt')
        .and
        .to.contain.text('bar.txt')
        .and
        .to.contain.text('hello')
        .and
        .to.contain.text('world');
    }
  );

  it('has "Directory details" header and directory name in subheader for single directory-type file',
    async function () {
      await givenDefaultStubs(this);
      await givenFileModel(this, {
        name: 'foo',
        type: 'dir',
      });

      await renderComponent();

      const modalHeader = find('.file-info-modal-header');
      const header = modalHeader.querySelector('h1');
      expect(header).to.exist;
      expect(header).to.have.trimmed.text('Directory details');
      const subheader = modalHeader.querySelector('h2');
      expect(subheader).to.exist;
      expect(subheader).to.contain.text('foo');
    });

  it('shows API operations provided by fileManager', async function () {
    await givenDefaultStubs(this);
    await givenApiSamplesForSharedFile(this);

    await whenClickingOnApiAfterRender();
    await clickTrigger('.api-operation-row');

    const options = findAll('li.ember-power-select-option');
    expect(options).to.have.length(2);
    const optionTitles = options
      .map(opt => opt.querySelector('.api-command-title').textContent.trim());
    const fullOptionsString = optionTitles.join(',');
    expect(fullOptionsString).to.contain('Get test data');
    expect(fullOptionsString).to.contain('Test xrootd command');
  });

  it('shows type, description and clipboard for selected REST operation', async function () {
    await givenDefaultStubs(this);
    await givenApiSamplesForSharedFile(this);

    await whenClickingOnApiAfterRender();
    await clickTrigger('.api-operation-row');
    await selectChoose('.api-operation-row', 'Get test data');
    expect(find('.item-info-row-type-api-command .api-tag-label'))
      .to.contain.text('REST');
    expect(find('.item-info-row-description .description-value'))
      .to.contain.text('Return test data.');
    expect(find('.item-info-row-api-command .clipboard-input'))
      .to.contain.text(
        'curl -L -X GET "https://dev-onezone.default.svc.cluster.local/api/v3/onezone/test/path/to/data"'
      );
  });

  it('shows type, description and clipboard for selected xrootd operation',
    async function () {
      await givenDefaultStubs(this);
      await givenApiSamplesForSharedFile(this);

      await whenClickingOnApiAfterRender();
      await clickTrigger('.api-operation-row');
      await selectChoose('.api-operation-row', 'Test xrootd command');
      expect(find('.item-info-row-type-api-command .api-tag-label'))
        .to.contain.text('XRootD');
      expect(find('.item-info-row-description .description-value'))
        .to.contain.text('Test xrootd.');
      expect(find('.item-info-row-api-command .clipboard-input'))
        .to.contain.text('xrdcp -r \'root://root.example.com//data/test\' \'.\'');
    }
  );
});

async function renderComponent() {
  await render(hbs `{{file-info-modal
    open=true
    files=(or files (array file))
    initialTab=initialTab
    previewMode=previewMode
    share=share
    space=space
    selectedRestUrlType=selectedRestUrlType
    getDataUrl=getDataUrl
    storageLocationsProxy=storageLocationsProxy
    tabOptions=tabOptions
    browserModel=browserModel
  }}`);
}

async function givenDummySpace(testCase, data) {
  const space = await createSpaceModel(testCase, data);
  testCase.set('space', space);
  return space;
}

async function givenDummyFile(testCase) {
  await givenFileModel(testCase, {
    name: 'Onedata.txt',
    size: 1.5 * Math.pow(1024, 2),
    type: 'file',
    cdmiObjectId: exampleCdmiObjectId,
    mtime: Math.floor(Date.now() / 1000),
    posixPermissions: '644',
    activePermissionsType: 'posix',
  });
}

async function createFile(testCase, data) {
  const store = lookupService(testCase, 'store');
  const record = store.createRecord('file', {
    name: 'Dummy file',
    type: 'file',
    ...data,
  });
  return await record.save();
}

async function givenFileModel(testCase, data) {
  const entityId = globals.window.btoa('guid#space_id#file_id');
  const file = await createFile(testCase, {
    id: gri({
      entityId,
      entityType: fileEntityType,
      aspect: 'instance',
    }),
    ...data,
  });
  testCase.set('files', [file]);
  return file;
}

/**
 *
 * @param {Mocha.Context} testCase
 * @param {Array<Object>} filesData array of data to create files
 * @returns
 */
async function givenMultipleFileModels(testCase, filesData) {
  const files = [];
  for (let i = 0; i < filesData.length; ++i) {
    const entityId = globals.window.btoa(`guid#space_id#file_id_${i}`);
    const file = await createFile(testCase, {
      id: gri({
        entityId,
        entityType: fileEntityType,
        aspect: 'instance',
      }),
      ...filesData[i],
    });
    files.push(file);
  }
  return testCase.set('files', files);
}

async function givenFileModelWithQos(testCase, data) {
  const store = lookupService(testCase, 'store');
  return givenFileModel(testCase, {
    fileQosSummary: await store.createRecord('fileQosSummary', {
      requirements: [],
    }).save(),
    ...data,
  });
}

async function createSpaceModel(testCase, data) {
  const store = lookupService(testCase, 'store');
  return await createSpace(store, {
    name: 'Dummy space',
    ...data,
  });
}

function givenEmptyTabOptions(testCase) {
  testCase.set('tabOptions', {});
}

function givenQosTabDisabled(testCase) {
  testCase.set('tabOptions', {
    qos: {
      isVisible: false,
    },
  });
}

async function givenDefaultStubs(testCase) {
  await givenDummySpace(testCase);
  givenQosTabDisabled(testCase);
  const fileHardlinksResult = testCase.set('fileHardlinksResult', {
    hardlinkCount: 1,
    hardlinks: [],
    errors: [{ id: 'forbidden' }],
  });
  sinon.stub(lookupService(testCase, 'fileManager'), 'getFileHardlinks')
    .resolves(fileHardlinksResult);
  sinon.stub(lookupService(testCase, 'providerManager'), 'getCurrentProvider')
    .resolves({ name: 'provider', entityId: 'providerId' });
  sinon.stub(lookupService(testCase, 'storageManager'), 'getStorageById')
    .resolves({ name: 'storage', entityId: 'storage', provider: { name: 'provider' } });
  const getDataUrl = ({ selected: [firstSelected] }) => `link-${firstSelected}`;
  lookupService(testCase, 'appProxy').callParent =
    function callParent(methodName, ...args) {
      if (methodName === 'getDataUrl') {
        return getDataUrl(...args);
      }
    };
  testCase.set('getDataUrl', getDataUrl);
  const storageLocationsProxy = sinon.stub().resolves(storageLocations);
  testCase.set('storageLocationsProxy', storageLocationsProxy);
  if (!testCase.get('browserModel')) {
    testCase.set('browserModel', FilesystemBrowserModel.create({
      ownerSource: testCase.owner,
    }));
  }
  if (!testCase.get('file')) {
    testCase.set('file', testCase.file1);
  }
}

async function givenApiSamplesForSharedFile(testCase) {
  const fileApiSamples =
    sinon.stub(lookupService(testCase, 'fileManager'), 'getFileApiSamples')
    .resolves(apiSamples);
  testCase.get('file').setProperties({
    type: 'file',
  });
  testCase.setProperties({
    previewMode: true,
    fileApiSamples,
  });
}

async function whenClickingOnApiAfterRender() {
  await renderComponent();
  await click(findByText('API', '.nav-link'));
}
