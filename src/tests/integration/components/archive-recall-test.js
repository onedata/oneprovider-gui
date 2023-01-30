import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, click, fillIn } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { createFile, mockRootFiles } from '../../helpers/files';
import { lookupService } from '../../helpers/stub-service';
import DefaultUser from '../../helpers/default-user';
import {
  getFileRow,
} from '../../helpers/item-browser';
import sinon from 'sinon';
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { get } from '@ember/object';
import { generateDirEntityId } from 'oneprovider-gui/services/mock-backend';

describe('Integration | Component | archive recall (internal)', function () {
  setupRenderingTest();

  beforeEach(async function () {
    const defaultUserHelper = new DefaultUser(this);
    await defaultUserHelper.createUser('null');
    this.setProperties({
      onCancel: () => {},
      onArchiveRecallStarted: () => {},
      options: {
        checkTargetDelay: 10,
      },
    });
    const archiveManager = lookupService(this, 'archiveManager');
    archiveManager.recallArchive = async () => {};
    const store = lookupService(this, 'store');
    const dirEntityId = generateDirEntityId('root_id');
    const spaceRootDir = await store.createRecord('file', {
      id: `file.${dirEntityId}.instance:private`,
      name: 'space_root_dir',
      type: 'dir',
    }).save();
    const space = await store.createRecord('space', {
      id: 'space.space_id.instance:private',
      name: 'space_name',
      currentUserIsOwner: false,
      currentUserEffPrivileges: ['space_view'],
      rootDir: spaceRootDir,
    }).save();
    const datasetDirName = 'hello';
    const datasetDir = await store.createRecord('file', {
      name: datasetDirName,
    }).save();
    const dataset = await store.createRecord('dataset', {
      index: datasetDirName,
      spaceId: get(space, 'entityId'),
      parent: null,
      state: 'attached',
      rootFile: datasetDir,
      protectionFlags: [],
      effProtectionFlags: [],
      creationTime: Math.floor(Date.now() / 1000),
      archiveCount: 1,
      rootFilePath: '/abc',
      rootFileType: 'dir',
      rootFileDeleted: false,
    }).save();
    const archiveEntityId = 'archive_id';
    const archive = await store.createRecord('archive', {
      config: {
        incremental: {
          enabled: false,
        },
        layout: 'plain',
        includeDip: false,
      },
      description: 'Dummy archive',
      preservedCallback: 'http://example.com/preserved',
      deletedCallback: 'http://example.com/deleted',
      dataset,
      // properties not normally used when create
      id: gri({
        entityType: archiveEntityType,
        entityId: archiveEntityId,
        aspect: 'instance',
        scope: 'private',
      }),
      index: datasetDirName + archiveEntityId,
      creationTime: Math.floor(Date.now() / 1000),
      state: 'preserved',
      stats: {
        bytesArchived: 2048,
        filesArchived: 20,
        filesFailed: 0,
      },
      relatedAip: null,
      relatedDip: null,
      // NOTE: for this test it is not needed, but archive may be malfunctioning
      rootDir: null,
      baseArchive: null,
    }).save();

    this.setProperties({
      spaceRootDir,
      space,
      dataset,
      archive,
    });
  });

  afterEach(function () {
    // NOTE: using clock (that should be sinon fake timer) is optional - you should
    // initialize this.clock in selected test scenario
    if (this.clock) {
      this.clock.restore();
    }
  });

  it('lists contents of injected directory', async function () {
    const filesCount = 3;
    this.setProperties({
      space: this.get('space'),
    });
    mockRootFiles({
      testCase: this,
      rootDir: this.get('spaceRootDir'),
      filesCount,
    });
    stubDefaultCheckFileNameExists(this);

    await renderComponent();

    expect(findAll('.fb-table-row')).to.have.length(filesCount);
  });

  it('invokes recallArchive with selected directory id and target name', async function () {
    this.setProperties({
      space: this.get('space'),
    });
    const dir1 = createFile({
      name: 'dir1',
      type: 'dir',
    });
    const mockFilesArray = mockRootFiles({
      testCase: this,
      rootDir: this.get('spaceRootDir'),
      files: [dir1],
    });
    const archiveManager = lookupService(this, 'archiveManager');
    const recallArchiveSpy = sinon.spy(archiveManager, 'recallArchive');
    stubDefaultCheckFileNameExists(this);

    await renderComponent();

    const row = getFileRow(dir1);
    await click(row);
    await fillIn('.target-name-input', 'expected_target_name');
    expect(findAll('.file-selected')).to.have.length(1);
    expect(find('.target-name-input').value).to.contain('expected_target_name');
    expect(find('.submit-btn')).to.not.have.attr('disabled');
    await click('.submit-btn');
    expect(recallArchiveSpy).to.have.been.calledOnce;
    expect(recallArchiveSpy).to.have.been.calledWith(
      this.get('archive'),
      mockFilesArray.array[0],
      'expected_target_name'
    );
  });

  it('shows "already in use" validation message when selected directory contains file with the same name',
    async function () {
      prepareAlreadyExistEnv(this);

      await renderComponent();

      const submitBtn = find('.submit-btn');
      const targetNameFormGroup = find('.target-name-form');

      // right after render - file with initial name does not exist
      expect(targetNameFormGroup).to.not.have.class('has-error');
      expect(submitBtn).to.not.have.attr('disabled');
      expect(this.element).to.not.contain.text(this.expectedMessage);

      // change name to existing - show validation error
      await fillIn('.target-name-input', this.existingName);

      expect(targetNameFormGroup).to.have.class('has-error');
      expect(submitBtn).to.have.attr('disabled');
      expect(this.element).to.contain.text(this.expectedMessage);
    }
  );
});

async function renderComponent() {
  await render(hbs `
    {{#one-pseudo-modal id="pseudo-modal-id" as |modal|}}
      {{archive-recall
        modal=modal
        modalId="pseudo-modal-id"
        space=space
        archive=archive
        options=options
        onCancel=(action onCancel)
        onArchiveRecallStarted=(action onArchiveRecallStarted)
      }}
    {{/one-pseudo-modal}}
  `);
}

function stubDefaultCheckFileNameExists(testCase) {
  sinon.stub(
    lookupService(testCase, 'fileManager'),
    'checkFileNameExists'
  ).resolves(false);
}

function prepareAlreadyExistEnv(testCase) {
  testCase.expectedMessage =
    'This filename is already in use';
  testCase.existingName = 'dir1';
  const dir1 = createFile({
    name: testCase.existingName,
    type: 'dir',
  });
  mockRootFiles({
    testCase: testCase,
    rootDir: testCase.get('spaceRootDir'),
    files: [dir1],
  });
  const fileManager = lookupService(testCase, 'fileManager');
  const fetchChildrenAttrs = sinon.stub(fileManager, 'fetchChildrenAttrs');
  // any name
  fetchChildrenAttrs
    .resolves({
      children: [],
      isLast: true,
    });
  // default name initially entered into input
  fetchChildrenAttrs
    .withArgs({
      dirId: testCase.get('spaceRootDir.entityId'),
      scope: 'private',
      index: testCase.get('dataset.name'),
      limit: 1,
      offset: 0,
    })
    .resolves({
      children: [],
      isLast: true,
    });
  // name entered by user into input
  fetchChildrenAttrs
    .withArgs({
      dirId: testCase.get('spaceRootDir.entityId'),
      scope: 'private',
      index: testCase.existingName,
      limit: 1,
      offset: 0,
    })
    .resolves({
      children: [dir1],
      isLast: true,
    });
}
