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

const userId = 'current_user_id';
const userGri = `user.${userId}.instance:private`;

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
    `direct dataset toggle is visible, in "${directToggleStateText}" state and ${optionsEditableText} toggles when file has established and ${attachedStateText} direct dataset`;
  it(description, async function (done) {
    const directDataset = {
      id: 'dataset_id',
      state: isAttached ? 'attached' : 'detached',
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
    expect($directDatasetSection).exist;
    const $toggle = $directDatasetSection.find('.direct-dataset-attached-toggle');
    expect($toggle).to.exist;
    const toggleHelper = new ToggleHelper($toggle);
    expect(toggleHelper.isChecked()).to.equal(isAttached);
    ['data', 'metadata'].forEach(flag => {
      const $flagToggle = this.$(`.${flag}-flag-toggle`);
      expect($flagToggle).to.exist;
      if (isAttached) {
        expect($flagToggle).to.not.have.class('disabled');
      } else {
        expect($flagToggle).to.have.class('disabled');
      }
    });

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
    const directDataset = {
      id: 'dataset_id',
      state: attached ? 'attached' : 'detached',
      protectionFlags: flags,
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
    availableShortFlags.forEach(flag => {
      // if dataset is detached, all flags should be presented as false!
      const shouldToggleBeEnabled = attached && shortFlags.includes(flag);
      const $toggle = $directDatasetSection.find(`.${flag}-flag-toggle`);
      expect($toggle).to.exist;
      const toggleHelper = new ToggleHelper($toggle);
      expect(toggleHelper.isChecked()).to.equal(shouldToggleBeEnabled);
    });

    done();
  });
}

function testEffectiveProtectionInfo(flags) {
  const flagsText = flags.length ? flags.map(f => `"${f}"`).join(', ') : 'no';
  const shortFlags = flags.map(f => f.split('_protection')[0]);
  const availableShortFlags = ['data', 'metadata'];
  it(`displays proper information about effective protection flags for ${flagsText} file flag(s)`,
    async function (done) {
      this.set('file.effProtectionFlags', flags);

      render(this);

      const $protectionInfo = this.$('.datasets-effective-protection-info');
      expect($protectionInfo, 'protection info container').to.exist;
      availableShortFlags.forEach(flag => {
        const selector = `.${flag}-protection-enabled`;
        expect($protectionInfo.find(selector), selector)
          .to.have.length(shortFlags.includes(flag) ? 1 : 0);
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
