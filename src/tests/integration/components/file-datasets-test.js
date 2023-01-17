import { expect } from 'chai';
import { describe, it, beforeEach, before } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, click, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import ToggleHelper from '../../helpers/toggle';
import { createFileDatasetSummary, createDataset } from '../../helpers/datasets-archives';
import { setProperties } from '@ember/object';
import Service from '@ember/service';
import { lookupService, registerService } from '../../helpers/stub-service';
import sinon from 'sinon';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const ArchiveManager = Service.extend({
  createArchive() {},
  fetchDatasetArchives() {},
  getBrowsableArchive() {},
});

const SpaceManager = Service.extend({
  getSpace() {},
  getDirStatsServiceState() {},
});

describe('Integration | Component | file datasets', function () {
  setupRenderingTest();

  before(async function () {
    this.createFileDatasetSummary = (options) => createFileDatasetSummary(
      Object.assign({ testCase: this }, options)
    );
    this.createDataset = (...args) => createDataset(this, ...args);
  });

  beforeEach(async function () {
    registerService(this, 'archiveManager', ArchiveManager);
    registerService(this, 'spaceManager', SpaceManager);
    await givenSingleFile(this);
  });

  it('renders file name of injected file', async function () {
    this.set('file.name', 'hello world');

    await renderComponent(this);

    expect(document.querySelector('.modal-file-subheader .file-name'))
      .to.contain.text('hello world');
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

      await renderComponent(this);

      expect(find('.nav-item-archives'), 'archives nav item')
        .to.have.class('disabled');
    }
  );

  testHasArchivesTabEnabled({ datasetState: 'attached' });
  testHasArchivesTabEnabled({ datasetState: 'detached' });

  it('does not render archives count text if dataset is not established', async function () {
    await this.createFileDatasetSummary({ directDataset: null });

    await renderComponent(this);

    const navItemArchives = find('.nav-item-archives');
    expect(navItemArchives, 'archives nav item')
      .to.exist;
    expect(navItemArchives.textContent).to.match(/Archives\s*$/);
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

    await renderComponent(this);
    expect(find('.file-datasets-archives-tab'), 'archives tab content').to.not.exist;
    await click(find('.nav-link-archives'));

    expect(find('.file-datasets-archives-tab'), 'archives tab content').to.exist;
  });

  it('shows "no dataset" information and "Establish..." button when file does not belong to any dataset',
    async function () {
      await this.createDataset({
        state: 'attached',
      });

      await renderComponent(this);

      const contentInfoNoDataset = find('.content-info-no-dataset');
      expect(contentInfoNoDataset).to.exist;
      expect(contentInfoNoDataset.textContent).to.contain('This file does not belong to any dataset');
      const establishButton = find('.establish-dataset-btn');
      expect(establishButton).to.exist;
      expect(establishButton.getAttribute('disabled')).to.not.exist;
      expect(establishButton.textContent).to.contain('Establish dataset');
    }
  );

  it('has disabled "Establish..." button when file does not belong to any dataset and space has no "manageDatasets" privilege',
    async function () {
      await this.createDataset({
        state: 'attached',
      });
      this.set('space.privileges.manageDatasets', false);

      await renderComponent(this);

      const establishButton = find('.establish-dataset-btn');
      expect(establishButton).to.exist;
      expect(establishButton.getAttribute('disabled')).to.exist;
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
      this.set('space.privileges.manageDatasets', true);
      const establishDatasetSpy = sinon.spy(
        lookupService(this, 'datasetManager'),
        'establishDataset'
      );

      await renderComponent(this);
      await click('.establish-dataset-btn');

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

      await renderComponent(this);

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

      await renderComponent(this);

      const directDatasetControl = find('.direct-dataset-control');
      expect(directDatasetControl).to.exist;
      expect(directDatasetControl.textContent)
        .to.contain('No dataset has been established on this file.');
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

    await renderComponent(this);

    const directDatasetItem = find('.direct-dataset-item');
    expect(directDatasetItem, 'direct dataset item').to.exist;
    availableShortFlags.forEach(flag => {
      // if dataset is detached, all flags should be presented as false!
      const shouldToggleBeEnabled = attached && shortFlags.includes(flag);
      const selector = `.${flag}-flag-toggle`;
      const toggle = directDatasetItem.querySelector(selector);
      expect(toggle, `${selector} for direct dataset`).to.exist;
      const toggleHelper = new ToggleHelper(toggle);
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

      await renderComponent(this);

      const protectionInfo = find('.datasets-effective-protection-info');
      expect(protectionInfo, 'protection info container').to.exist;
      availableShortFlags.forEach(flag => {
        const isEnabled = shortFlags.includes(flag);
        const tagSelector = `.${flag}-protected-tag`;
        const tag = protectionInfo.querySelector(tagSelector);
        expect(tag, tagSelector).to.exist;
        expect(tag, tagSelector)
          .to.have.class(`protected-tag-${isEnabled ? 'enabled' : 'disabled'}`);
      });
    }
  );
}

async function renderComponent(testCase) {
  testCase.set('files', [testCase.get('file')]);
  await render(hbs `{{#one-pseudo-modal as |modal|}}
    {{file-datasets
      modal=modal
      files=files
      space=space
    }}
  {{/one-pseudo-modal}}`);
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

    await renderComponent(this);

    expect(find('.nav-item-archives'), 'archives nav item')
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

    await renderComponent(this);

    const navItemArchives = find('.nav-item-archives');
    expect(navItemArchives, 'archives nav item')
      .to.exist;
    expect(navItemArchives.textContent)
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
    privileges: {
      manageDatasets: true,
    },
  });
}
