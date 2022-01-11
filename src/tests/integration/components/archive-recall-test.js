import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import { createFile, mockRootFiles } from '../../helpers/files';
import { lookupService } from '../../helpers/stub-service';
import {
  getFileRow,
} from '../../helpers/item-browser';
import { click, fillIn } from 'ember-native-dom-helpers';
import sinon from 'sinon';
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { get } from '@ember/object';
import { generateDirEntityId } from 'oneprovider-gui/services/mock-backend';
import $ from 'jquery';

describe('Integration | Component | archive recall', function () {
  setupComponentTest('archive-recall', {
    integration: true,
  });

  beforeEach(function () {
    this.setProperties({
      onCancel: () => {},
      onArchiveRecallStarted: () => {},
    });
    const archiveManager = lookupService(this, 'archiveManager');
    archiveManager.recallArchive = async () => {};
    const store = lookupService(this, 'store');
    const dirEntityId = generateDirEntityId('root_id');
    const spaceRootDir = store.createRecord('file', {
      id: `file.${dirEntityId}.instance:private`,
      name: 'space_root_dir',
      type: 'dir',
    });
    const space = store.createRecord('space', {
      id: 'space.space_id.instance:private',
      name: 'space_name',
      currentUserIsOwner: false,
      currentUserEffPrivileges: ['space_view'],
      rootDir: spaceRootDir,
    });
    const datasetDirName = 'hello';
    const datasetDir = store.createRecord('file', {
      name: datasetDirName,
    });
    const dataset = store.createRecord('dataset', {
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
    });
    const archiveEntityId = 'archive_id';
    const archive = store.createRecord('archive', {
      config: {
        incremental: {
          enabled: false,
        },
        layout: 'plain',
        includeDip: false,
      },
      description: 'Dummy archive',
      preservedCallback: 'http://example.com/preserved',
      purgedCallback: 'http://example.com/purged',
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
    });

    this.setProperties({
      spaceRootDir,
      space,
      dataset,
      archive,
    });
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

    await render(this);

    expect(this.$('.fb-table-row')).to.have.length(filesCount);
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

    await render(this);

    const row = getFileRow(dir1)[0];
    await click(row);
    await fillIn('.target-name-input', 'expected_target_name');
    expect($('.file-selected')).to.have.length(1);
    expect($('.target-name-input').val()).to.contain('expected_target_name');
    await click('.submit-btn');
    expect(recallArchiveSpy).to.have.been.calledOnce;
    expect(recallArchiveSpy).to.have.been.calledWith(
      this.get('archive'),
      mockFilesArray.array[0],
      'expected_target_name'
    );
  });
});

async function render(testCase) {
  testCase.render(hbs `
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
  await wait();
}
