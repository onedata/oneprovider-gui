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
import { RuntimeProperties as DatasetRuntimeProperties } from 'oneprovider-gui/models/dataset';
import EmberObject from '@ember/object';

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

const DatasetMock = EmberObject.extend(DatasetRuntimeProperties);

describe('Integration | Component | file datasets', function () {
  setupComponentTest('file-datasets', {
    integration: true,
  });

  context('for single file', function () {
    beforeEach(function () {
      this.set('file', createFile({ name: 'test-file.txt' }));
      const fileDatasetSummary = {
        getRelation(relation) {
          if (relation === 'directDataset') {
            return promiseObject(resolve(null));
          }
        },
        belongsTo(relation) {
          if (relation === 'directDataset') {
            return { id: () => null };
          }
        },
      };
      this.get('file').getRelation = (relation) => {
        if (relation === 'fileDatasetSummary') {
          return promiseObject(resolve(fileDatasetSummary));
        }
      };
    });

    it('renders file name of injected file', async function (done) {
      this.set('file.name', 'hello world');

      render(this);
      await wait();

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

    testDirectDatasetShow(true);
    testDirectDatasetShow(false);
  });
});

function testDirectDatasetShow(isAttached) {
  const directToggleStateText = isAttached ? 'on' : 'off';
  const optionsEditableText = isAttached ? 'enabled' : 'disabled';
  const attachedStateText = isAttached ? 'attached' : 'detached';
  const description =
    `direct dataset toggle is visible, in "${directToggleStateText}" state and ${optionsEditableText} when file has established and ${attachedStateText} direct dataset`;
  it(description, async function (done) {
    const directDataset = {
      id: 'dataset_id',
      state: isAttached ? 'attached' : 'detached',
      isAttached,
    };
    const fileDatasetSummary = {
      getRelation(relation) {
        if (relation === 'directDataset') {
          return promiseObject(resolve(directDataset));
        }
      },
      belongsTo(relation) {
        if (relation === 'directDataset') {
          return { id: () => 'dataset_id' };
        }
      },
    };
    this.get('file').getRelation = (relation) => {
      if (relation === 'fileDatasetSummary') {
        return promiseObject(resolve(fileDatasetSummary));
      }
    };

    render(this);
    await wait();

    const $directDatasetSection = this.$('.direct-dataset-section');
    expect($directDatasetSection, 'direct dataset section').exist;
    const $toggle = $directDatasetSection.find('.direct-dataset-attached-toggle');
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
    });
    const fileDatasetSummary = {
      getRelation(relation) {
        if (relation === 'directDataset') {
          return promiseObject(resolve(directDataset));
        }
      },
      belongsTo(relation) {
        if (relation === 'directDataset') {
          return { id: () => 'dataset_id' };
        }
      },
    };
    this.get('file').getRelation = (relation) => {
      if (relation === 'fileDatasetSummary') {
        return promiseObject(resolve(fileDatasetSummary));
      }
    };

    render(this);
    await wait();

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
      this.set('file.effProtectionFlags', flags);

      render(this);

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

function render(testCase) {
  testCase.set('files', [testCase.get('file')]);
  testCase.render(hbs `{{#one-pseudo-modal as |modal|}}
    {{file-datasets
      modal=modal
      files=files
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

function createDataset(data) {
  return DatasetMock.create(data);
}
