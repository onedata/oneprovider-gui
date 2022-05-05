import { expect } from 'chai';
import { describe, it, beforeEach, before } from 'mocha';
import { setupComponentTest } from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import $ from 'jquery';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import wait from 'ember-test-helpers/wait';
import ToggleHelper from '../../helpers/toggle';
import { createFileDatasetSummary, createDataset } from '../../helpers/datasets-archives';
import { setProperties } from '@ember/object';
import Service from '@ember/service';
import { lookupService, registerService } from '../../helpers/stub-service';
import { click, find } from 'ember-native-dom-helpers';
import sinon from 'sinon';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const ArchiveManager = Service.extend({
  createArchive() {},
  fetchDatasetArchives() {},
  getBrowsableArchive() {},
});

describe('Integration | Component | file datasets', function () {
  setupComponentTest('file-datasets', {
    integration: true,
  });

  before(async function () {
    this.createFileDatasetSummary = (options) => createFileDatasetSummary(
      Object.assign({ testCase: this }, options)
    );
    this.createDataset = (...args) => createDataset(this, ...args);
  });

  beforeEach(async function () {
    registerService(this, 'archiveManager', ArchiveManager);
    await givenSingleFile(this);
  });

  it('renders file name of injected file', async function () {
    this.set('file.name', 'hello world');

    await render(this);

    expect($('.modal-file-subheader .file-name').text()).to.contain('hello world');
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
      await this.createFileDatasetSummary({ directDataset: null });

      await render(this);

      expect(this.$('.nav-item-archives'), 'archives nav item')
        .to.have.class('disabled');
    }
  );

  testHasArchivesTabEnabled({ datasetState: 'attached' });
  testHasArchivesTabEnabled({ datasetState: 'detached' });

  it('does not render archives count text if dataset is not established', async function () {
    await this.createFileDatasetSummary({ directDataset: null });

    await render(this);

    const $navItemArchives = this.$('.nav-item-archives');
    expect($navItemArchives, 'archives nav item')
      .to.exist;
    expect($navItemArchives.text()).to.match(/Archives\s*$/);
  });

  testArchivesTabCount({ archiveCount: 0 });
  testArchivesTabCount({ archiveCount: 5 });

  it('renders archives browser only after "Archives" tab gets selected', async function () {
    await this.createDataset({
      state: 'attached',
      protectionFlags: [],
      parent: null,
      archiveCount: 0,
    });
    await this.createFileDatasetSummary();

    await render(this);
    expect(find('.file-datasets-archives-tab'), 'archives tab content').to.not.exist;
    await click(find('.nav-link-archives'));

    expect(find('.file-datasets-archives-tab'), 'archives tab content').to.exist;
  });

  it('shows "no dataset" information and "Establish..." button when file does not belong to any dataset',
    async function () {
      await this.createDataset({
        state: 'attached',
        protectionFlags: [],
        parent: null,
        archiveCount: 0,
      });

      await render(this);

      const contentInfoNoDataset = find('.content-info-no-dataset');
      expect(contentInfoNoDataset).to.exist;
      expect(contentInfoNoDataset.textContent).to.contain('This file does not belong to any dataset');
      const establishButton = find('.establish-first-dataset-btn');
      expect(establishButton).to.exist;
      expect(establishButton.textContent).to.contain('Establish dataset here');
    }
  );

  it('invokes dataset estabilish when clicked on "Establish..." button on "no dataset" view',
    async function () {
      await this.createDataset({
        state: 'attached',
        protectionFlags: [],
        parent: null,
        archiveCount: 0,
      });
      const establishDatasetSpy = sinon.spy(
        lookupService(this, 'datasetManager'),
        'establishDataset'
      );

      await render(this);
      await click('.establish-first-dataset-btn');

      expect(establishDatasetSpy).to.have.been.calledOnce;
    }
  );

  it('does not show "no dataset" information when file has ancestor dataset, but is not a direct dataset itself',
    async function () {
      await this.createDataset({
        state: 'attached',
        protectionFlags: [],
        parent: null,
        archiveCount: 0,
      });
      await this.createFileDatasetSummary({
        directDataset: null,
        effAncestorDatasets: [this.get('dataset')],
      });

      await render(this);

      const contentInfoNoDataset = find('.content-info-no-dataset');
      expect(contentInfoNoDataset).to.not.exist;
    }
  );

  it('renders direct dataset control with "not established" information when file has ancestor dataset, but is not a direct dataset itself',
    async function () {
      await this.createDataset({
        state: 'attached',
      });
      await this.createFileDatasetSummary({
        directDataset: null,
        effAncestorDatasets: [this.get('dataset')],
      });

      await render(this);

      const directDatasetControl = find('.direct-dataset-control');
      expect(directDatasetControl).to.exist;
      expect(directDatasetControl.textContent)
        .to.contain('This file has no direct dataset established');
    }
  );
});

function testDirectDatasetProtection(flags, attached = true) {
  const flagsText = flags.length ? flags.map(f => `"${f}"`).join(', ') : 'no';
  const shortFlags = flags.map(f => f.split('_protection')[0]);
  const availableShortFlags = ['data', 'metadata'];
  const attachedText = attached ? 'attached' : 'detached';
  const description =
    `displays proper information about direct protection flags for ${flagsText} flag(s) in ${attachedText} dataset`;
  it(description, async function () {
    await this.createDataset({
      state: attached ? 'attached' : 'detached',
      protectionFlags: flags,
      parent: null,
    });
    await this.createFileDatasetSummary();

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
  });
}

function testEffectiveProtectionInfo(flags) {
  const flagsText = flags.length ? flags.map(f => `"${f}"`).join(', ') : 'no';
  const shortFlags = flags.map(f => f.split('_protection')[0]);
  const availableShortFlags = ['data', 'metadata'];
  it(`displays tags with information about effective protection flags for ${flagsText} file flag(s)`,
    async function () {
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

function testHasArchivesTabEnabled({ datasetState }) {
  if (!datasetState) {
    throw new Error('datasetState argument is required');
  }
  const description =
    `renders "Archives" nav tab as enabled if dataset has been established and is ${datasetState}`;
  it(description, async function () {
    await this.createDataset({
      state: datasetState,
      protectionFlags: [],
      parent: null,
    });
    await this.createFileDatasetSummary();

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
    await this.createDataset({
      state: 'attached',
      protectionFlags: [],
      parent: null,
      archiveCount,
    });
    await this.createFileDatasetSummary();

    await render(this);

    const $navItemArchives = this.$('.nav-item-archives');
    expect($navItemArchives, 'archives nav item')
      .to.exist;
    expect($navItemArchives.text())
      .to.match(new RegExp(`Archives\\s+\\(${archiveCount}\\)`));
  });
}

async function givenSingleFile(testCase) {
  testCase.set('file', createFile({ name: 'test-file.txt' }));
  await testCase.createFileDatasetSummary();
  testCase.get('file').getRelation = (relation) => {
    if (relation === 'fileDatasetSummary') {
      return promiseObject(resolve(testCase.get('fileDatasetSummary')));
    }
  };
  testCase.set('space', {
    entityId: 'space_id',
    name: 'Dummy space',
    privileges: {},
  });
}
