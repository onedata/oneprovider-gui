/**
 * Complete view needing layout (eg. modal) for deleting selected archives.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';
import { equal, raw, promise, or, not, array, lte } from 'ember-awesome-macros';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import handleMultiFilesOperation from 'oneprovider-gui/utils/handle-multi-files-operation';
import _ from 'lodash';
import { all as allFulfilled } from 'rsvp';

export default Component.extend(I18n, {
  // use 'archives-delete-part' CSS class to style the component
  tagName: '',

  datasetManager: service(),
  archiveManager: service(),
  globalNotify: service(),
  errorExtractor: service(),
  i18n: service(),
  fileManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archivesDelete',

  /**
   * @virtual
   * @type {Array<Utils.BrowsableArchive>}
   */
  archives: undefined,

  /**
   * Instance of modal-like component to render layout (header, body, footer)
   * @virtual
   * @type {Component}
   */
  modal: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onClose: notImplementedIgnore,

  /**
   * Default implementation set on init if not provided.
   * @virtual optional
   * @param {Boolean} isProcessing
   * @type {Function}
   */
  onProcessingUpdate: notImplementedIgnore,

  /**
   * If `onProcessingUpdate` is provided, this probably should be injected.
   * @virtual optional
   * @type {Boolean}
   */
  processing: false,

  /**
   * @type {String}
   */
  confirmationValue: '',

  /**
   * @type {Number}
   */
  maxDisplayItems: 5,

  showArchivesDetails: lte('archives.length', 'maxDisplayItems'),

  isSingleItem: equal('archives.length', raw(1)),

  confirmationSourceText: computed('archives.length', function confirmationSourceText() {
    const count = this.get('archives.length');
    const multi = count > 1;
    return this.t('body.confirmation.base', {
      archivesText: this.t(`body.archive.${multi ? 'selectedCount' : 'theArchive'}`, {
        count,
      }),
    });
  }),

  confirmationTextMatch: equal('confirmationSourceText.string', 'confirmationValue'),

  deleteDisabled: or(not('confirmationTextMatch'), 'processing'),

  deleteTip: computed('confirmationTextMatch', function deleteTip() {
    if (!this.get('confirmationTextMatch')) {
      return this.t('body.confirmationTextNotMatch');
    }
  }),

  datasetsIds: array.map('archives', archive => archive.relationEntityId('dataset')),

  /**
   *
   * @type {ComputedProperty<PromiseArray<Models.Dataset>>}
   */
  datasetsProxy: promise.array(computed('datasetsIds', function datasetsProxy() {
    const {
      datasetsIds,
      datasetManager,
    } = this.getProperties('datasetsIds', 'datasetManager');
    const uniqDatasetIds = _.uniq(datasetsIds.compact());
    return allFulfilled(
      uniqDatasetIds.map(dirId => datasetManager.getDataset(dirId))
    );
  })),

  datasetNameProxy: promise.object(computed(
    'datasetsProxy',
    async function datasetNameProxy() {
      let datasets;
      try {
        datasets = await this.get('datasetsProxy');
      } catch (error) {
        console.error(error);
        return this.t('body.unknownDataset');
      }

      if (!datasets || !datasets.length) {
        return this.t('body.unknownDataset');
      } else if (datasets.length === 1) {
        return get(datasets[0], 'name');
      } else {
        return datasets.mapBy('name').join(', ');
      }
    }
  )),

  init() {
    this._super(...arguments);
    if (!this.get('onProcessingUpdate')) {
      this.set('onProcessingUpdate', (isProcessing) => {
        safeExec(this, 'set', 'processing', isProcessing);
      });
    }
  },

  actions: {
    close() {
      this.get('onClose')();
    },
    async delete() {
      if (this.get('deleteDisabled')) {
        return;
      }

      const {
        archiveManager,
        globalNotify,
        archives,
        onClose,
        onProcessingUpdate,
        fileManager,
        errorExtractor,
        i18n,
        i18nPrefix,
        datasetsIds,
      } = this.getProperties(
        'archiveManager',
        'globalNotify',
        'archives',
        'onClose',
        'onProcessingUpdate',
        'fileManager',
        'errorExtractor',
        'i18n',
        'i18nPrefix',
        'datasetsIds',
      );
      try {
        onProcessingUpdate(true);
        await handleMultiFilesOperation({
          files: archives,
          globalNotify,
          errorExtractor,
          i18n,
          operationErrorKey: `${i18nPrefix}.deletingArchives`,
        }, async archive => {
          await archiveManager.deleteArchive(archive);
        });
        onClose();
      } finally {
        // only a side effect
        for (const dirId of datasetsIds) {
          fileManager.dirChildrenRefresh(dirId, { forced: true }).catch(error => {
            console.error(
              `components:archives-delete#delete: failed to refresh archives list of dataset ${dirId}: ${error}`
            );
          });
        }
        onProcessingUpdate(false);
      }
    },
  },
});
