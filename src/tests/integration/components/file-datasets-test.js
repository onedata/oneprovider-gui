import { expect } from 'chai';
import { describe, it, context, beforeEach } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import $ from 'jquery';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import wait from 'ember-test-helpers/wait';
import ToggleHelper from '../../helpers/toggle';
import { createFileDatasetSummary } from '../../helpers/datasets-archives';
import { RuntimeProperties as DatasetRuntimeProperties } from 'oneprovider-gui/models/dataset';
import EmberObject, { setProperties } from '@ember/object';
import Service from '@ember/service';
import { registerService } from '../../helpers/stub-service';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const DatasetMock = EmberObject.extend(DatasetRuntimeProperties, {
  relationEntityId() {
    return null;
  },
  hasParent: () => false,
});

const ArchiveManager = Service.extend({
  createArchive() {},
  fetchDatasetArchives() {},
  getBrowsableArchive() {},
});

describe('Integration | Component | file datasets', function () {
  setupComponentTest('file-datasets', {
    integration: true,
  });

  beforeEach(function () {
    registerService(this, 'archiveManager', ArchiveManager);
  });

  context('for single file', function () {
    beforeEach(function () {
      this.set('file', createFile({ name: 'test-file.txt' }));
      this.set('fileDatasetSummary', createFileDatasetSummary());
      this.get('file').getRelation = (relation) => {
        if (relation === 'fileDatasetSummary') {
          return promiseObject(resolve(this.get('fileDatasetSummary')));
        }
      };
      this.set('space', {
        entityId: 'space_id',
        name: 'Dummy space',
        privileges: {},
      });
    });

    it('renders file name of injected file', async function (done) {
      this.set('file.name', 'hello world');

      await render(this);

      expect($('.modal-file-subheader .file-name').text()).to.contain('hello world');

      done();
    });

    [
      [],
      ['data_protection'],
      ['metadata_protection'],
      ['data_protection', 'metadata_protection'],
    ].forEach(fileFlags => {
      testEffectiveProtectionInfo(fileFlags);
      testDirectDatasetProtection(fileFlags);
    });

    [
      [],
      ['data_protection', 'metadata_protection'],
    ].forEach(fileFlags => {
      testDirectDatasetProtection(fileFlags, false);
    });

    it('renders "Archives" nav tab as disabled with proper tooltip if dataset has not been established yet',
      async function () {
        this.set(
          'fileDatasetSummary',
          createFileDatasetSummary({ directDataset: null })
        );

        await render(this);

        expect(this.$('.nav-item-archives'), 'archives nav item')
          .to.have.class('disabled');
      }
    );

    testHasArchivesTabEnabled({ datasetState: 'attached' });
    testHasArchivesTabEnabled({ datasetState: 'detached' });

    it('does not render archives count text if dataset is not established', async function () {
      this.set(
        'fileDatasetSummary',
        createFileDatasetSummary({ directDataset: null })
      );

      await render(this);

      const $navItemArchives = this.$('.nav-item-archives');
      expect($navItemArchives, 'archives nav item')
        .to.exist;
      expect($navItemArchives.text()).to.match(/Archives\s*$/);
    });

    testArchivesTabCount({ archiveCount: 0 });
    testArchivesTabCount({ archiveCount: 5 });

    testDirectDatasetShow({ isAttached: true });
    testDirectDatasetShow({ isAttached: false });

    it('renders archives browser only after "Archives" tab gets selected', async function () {
      const directDataset = createDataset({
        id: 'dataset_id',
        state: 'attached',
        protectionFlags: [],
        parent: null,
        archiveCount: 0,
      });
      this.set(
        'fileDatasetSummary',
        createFileDatasetSummary({ directDataset })
      );

      await render(this);
      expect($('.file-datasets-archives-tab'), 'archives tab content').to.not.exist;
      const $navLinkArchives = this.$('.nav-link-archives');
      $navLinkArchives.click();
      await wait();

      expect($('.file-datasets-archives-tab'), 'archives tab content').to.exist;
    });

    it('shows "no dataset" information and "Establish..." button when file does not belong to any dataset',
      async function () {
        // FIXME: implement tests
      }
    );

    it('does not show "no dataset" information when file does not belong to any dataset',
      async function () {
        // FIXME: implement tests
      }
    );

    it('invokes dataset estabilish when clicked on "Establish..." button on "no dataset" view',
      async function () {
        // FIXME: implement tests
      }
    );
  });
});

function testDirectDatasetShow({ isAttached }) {
  const directToggleStateText = isAttached ? 'on' : 'off';
  const optionsEditableText = isAttached ? 'enabled' : 'disabled';
  const attachedStateText = isAttached ? 'attached' : 'detached';
  const description =
    `direct dataset toggle is visible, in "${directToggleStateText}" state and ${optionsEditableText} when file has established and ${attachedStateText} direct dataset`;
  it(description, async function (done) {
    const directDataset = createDataset({
      id: 'dataset_id',
      state: isAttached ? 'attached' : 'detached',
      isAttached,
      parent: null,
    });
    this.set('fileDatasetSummary', createFileDatasetSummary({ directDataset }));

    await render(this);

    const $directDatasetControl = this.$('.direct-dataset-control');
    expect($directDatasetControl, 'direct dataset section').exist;
    const $toggle = $directDatasetControl.find('.direct-dataset-attached-toggle');
    expect($toggle, 'direct-dataset-attached-toggle').to.exist;
    const toggleHelper = new ToggleHelper($toggle);
    expect(toggleHelper.isChecked()).to.equal(isAttached);

    done();
  });
}

function testDirectDatasetProtection(flags, attached = true) {
  const flagsText = flags.length ? flags.map(f => `"${f}"`).join(', ') : 'no';
  const shortFlags = flags.map(f => f.split('_protection')[0]);
  const availableShortFlags = ['data', 'metadata'];
  const attachedText = attached ? 'attached' : 'detached';
  const description =
    `displays proper information about direct protection flags for ${flagsText} flag(s) in ${attachedText} dataset`;
  it(description, async function (done) {
    const directDataset = createDataset({
      id: 'dataset_id',
      state: attached ? 'attached' : 'detached',
      protectionFlags: flags,
      parent: null,
    });
    this.set('fileDatasetSummary', createFileDatasetSummary({ directDataset }));

    await render(this);

    const $directDatasetItem = this.$('.direct-dataset-item');
    expect($directDatasetItem, 'direct dataset item').to.exist;
    availableShortFlags.forEach(flag => {
      // if dataset is detached, all flags should be presented as false!
      const shouldToggleBeEnabled = attached && shortFlags.includes(flag);
      const selector = `.${flag}-flag-toggle`;
      const $toggle = $directDatasetItem.find(selector);
      expect($toggle, `${selector} for direct dataset`).to.exist;
      const toggleHelper = new ToggleHelper($toggle);
      expect(toggleHelper.isChecked(), flag).to.equal(shouldToggleBeEnabled);
    });

    done();
  });
}

function testEffectiveProtectionInfo(flags) {
  const flagsText = flags.length ? flags.map(f => `"${f}"`).join(', ') : 'no';
  const shortFlags = flags.map(f => f.split('_protection')[0]);
  const availableShortFlags = ['data', 'metadata'];
  it(`displays tags with information about effective protection flags for ${flagsText} file flag(s)`,
    async function (done) {
      const {
        file,
        fileDatasetSummary,
      } = this.getProperties('file', 'fileDatasetSummary');
      const dataIsProtected = shortFlags.includes('data');
      const metadataIsProtected = shortFlags.includes('metadata');
      setProperties(fileDatasetSummary, { dataIsProtected, metadataIsProtected });
      setProperties(file, { dataIsProtected, metadataIsProtected });

      await render(this);

      const $protectionInfo = this.$('.datasets-effective-protection-info');
      expect($protectionInfo, 'protection info container').to.exist;
      availableShortFlags.forEach(flag => {
        const isEnabled = shortFlags.includes(flag);
        const tagSelector = `.${flag}-protected-tag`;
        const $tag = $protectionInfo.find(tagSelector);
        expect($tag, tagSelector).to.exist;
        expect($tag, tagSelector)
          .to.have.class(`protected-tag-${isEnabled ? 'enabled' : 'disabled'}`);
      });

      done();
    }
  );
}

async function render(testCase) {
  testCase.set('files', [testCase.get('file')]);
  testCase.render(hbs `{{#one-pseudo-modal as |modal|}}
    {{file-datasets
      modal=modal
      files=files
      space=space
    }}
  {{/one-pseudo-modal}}`);
  await wait();
}

function createFile(override = {}, ownerGri = userGri) {
  return Object.assign({
    modificationTime: moment('2020-01-01T08:50:00+00:00').unix(),
    posixPermissions: '777',
    type: 'file',
    belongsTo(name) {
      if (name === 'owner') {
        return {
          id: () => ownerGri,
        };
      }
    },
  }, override);
}

function createDataset(data) {
  return DatasetMock.create(data);
}

function testHasArchivesTabEnabled({ datasetState }) {
  if (!datasetState) {
    throw new Error('datasetState argument is required');
  }
  const description =
    `renders "Archives" nav tab as enabled if dataset has been established and is ${datasetState}`;
  it(description, async function () {
    const directDataset = createDataset({
      id: 'dataset_id',
      state: datasetState,
      protectionFlags: [],
      parent: null,
    });
    this.set(
      'fileDatasetSummary',
      createFileDatasetSummary({ directDataset })
    );

    await render(this);

    expect(this.$('.nav-item-archives'), 'archives nav item')
      .to.not.have.class('disabled');
  });
}

function testArchivesTabCount({ archiveCount }) {
  const archivesCountText = archiveCount === 1 ?
    `${archiveCount} archive is` : `${archiveCount} archives are`;
  const description =
    `renders archives ${archiveCount} count in "Archives" tab name if ${archivesCountText} created for dataset`;
  it(description, async function () {
    const directDataset = createDataset({
      id: 'dataset_id',
      state: 'attached',
      protectionFlags: [],
      parent: null,
      archiveCount,
    });
    this.set(
      'fileDatasetSummary',
      createFileDatasetSummary({ directDataset })
    );

    await render(this);

    const $navItemArchives = this.$('.nav-item-archives');
    expect($navItemArchives, 'archives nav item')
      .to.exist;
    expect($navItemArchives.text())
      .to.match(new RegExp(`Archives\\s+\\(${archiveCount}\\)`));
  });
}
