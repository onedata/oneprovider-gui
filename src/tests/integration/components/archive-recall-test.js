import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
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

describe('Integration | Component | archive recall (internal)', function () {
  setupComponentTest('archive-recall', {
    integration: true,
  });

  beforeEach(function () {
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
    stubDefaultCheckFileNameExists(this);

    await render(this);

    const row = getFileRow(dir1)[0];
    await click(row);
    await fillIn('.target-name-input', 'expected_target_name');
    expect(this.$('.file-selected')).to.have.length(1);
    expect(this.$('.target-name-input').val()).to.contain('expected_target_name');
    expect(this.$('.submit-btn')).to.not.have.attr('disabled');
    await click('.submit-btn');
    expect(recallArchiveSpy).to.have.been.calledOnce;
    expect(recallArchiveSpy).to.have.been.calledWith(
      this.get('archive'),
      mockFilesArray.array[0],
      'expected_target_name'
    );
  });

  it('shows "already exists" validation message when selected directory contains file with the same name',
    async function () {
      prepareAlreadyExistEnv(this);

      await render(this);

      const $this = this.$();
      const $submitBtn = this.$('.submit-btn');
      const $targetNameFormGroup = this.$('.target-name-form');

      // right after render - file with initial name does not exist
      expect($targetNameFormGroup).to.not.have.class('has-error');
      expect($submitBtn).to.not.have.attr('disabled');
      expect($this.text()).to.not.contain(this.expectedMessage);

      // change name to exising - show validation error
      await fillIn('.target-name-input', this.existingName);

      expect($targetNameFormGroup).to.have.class('has-error');
      expect($submitBtn).to.have.attr('disabled');
      expect($this.text()).to.contain(this.expectedMessage);
    }
  );

  // FIXME: malfunctioning test - to fix or remove
  // an error occurs: "Uncaught Error: end called without begin" when using useFakeTimers
  // with shouldAdvanceTime, but when shouldAdvanceTime is false (and not using await with
  // render) wait in other tests are stuck

  // it('checks if file exists with delay when typing in target name',
  //   async function () {
  //     this.clock = sinon.useFakeTimers({
  //       now: Date.now(),
  //       shouldAdvanceTime: true,
  //     });
  //     this.setProperties({
  //       options: {
  //         checkTargetDelay: 10,
  //       },
  //     });
  //     const checkTargetDelay = this.get('options.checkTargetDelay');
  //     prepareAlreadyExistEnv(this);

  //     await render(this);
  //     this.clock.tick(checkTargetDelay + 1);

  //     // Then: check async behaviour when user types part of names with delay

  //     const $this = this.$();
  //     const $submitBtn = this.$('.submit-btn');
  //     const $targetNameFormGroup = this.$('.target-name-form');

  //     // right after render - file with initial name does not exist
  //     expect($targetNameFormGroup).to.not.have.class('has-error');
  //     expect($submitBtn).to.not.have.attr('disabled');
  //     expect($this.text()).to.not.contain(this.expectedMessage);

  //     // change name to something that does not exists(valid)
  //     fillIn(
  //       '.target-name-input',
  //       'random_name'
  //     );

  //     expect($targetNameFormGroup, 'random name')
  //       .to.not.have.class('has-error');
  //     // submit should be disabled until check is invoked and done
  //     expect($submitBtn, 'random name')
  //       .to.have.attr('disabled');

  //     this.clock.tick(checkTargetDelay / 2);

  //     // waiting for check to start - validation state should not change
  //     expect($targetNameFormGroup, 'random name, after short time')
  //       .to.not.have.class('has-error');
  //     expect($submitBtn, 'random name, after short time')
  //       .to.have.attr('disabled');

  //     // change name to something that exists (invalid)
  //     fillIn(
  //       '.target-name-input',
  //       this.existingName
  //     );

  //     this.clock.tick(checkTargetDelay / 2 + 1);

  //     // waiting for check to start (delay because of next fillIn) - validation state
  //     // should not change
  //     expect($targetNameFormGroup, 'existing name, after short time')
  //       .to.not.have.class('has-error');
  //     expect($submitBtn, 'existing name, after short time')
  //       .to.have.attr('disabled');

  //     this.clock.tick(checkTargetDelay / 2 + 1);

  //     // after full checkTargetDelay time, validation error should be visible
  //     expect($targetNameFormGroup, 'existing name, after delay time')
  //       .to.have.class('has-error');
  //     expect($submitBtn, 'existing name, after delay time')
  //       .to.have.attr('disabled');
  //     expect($this.text(), 'existing name, after delay time')
  //       .to.contain(this.expectedMessage);
  //   }
  // );
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

function stubDefaultCheckFileNameExists(testCase) {
  sinon.stub(
    lookupService(testCase, 'fileManager'),
    'checkFileNameExists'
  ).resolves(false);
}

function prepareAlreadyExistEnv(testCase) {
  testCase.expectedMessage =
    'File with specified name already exists in selected location';
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
