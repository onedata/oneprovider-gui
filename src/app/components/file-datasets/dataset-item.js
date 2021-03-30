/**
 * Entry with information about an effective dataset for file/directory. 
 *
 * @module components/file-datasets/dataset-item
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { and } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'tr',
  classNames: ['dataset-item'],

  datasetManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.datasetItem',

  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  /**
   * @virtual optional
   */
  readonly: false,

  /**
   * @virtual optional
   * @type {String}
   */
  readonlyMesasage: '',

  /**
   * @virtual
   * @type {Function}
   */
  updateOpenedFileData: notImplementedIgnore,

  /**
   * Mapping of protection type (data or metadata) to name of icon representing it
   * @virtual
   * @type {Object}
   */
  protectionIcons: undefined,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isAttached: reads('dataset.isAttached'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  dataIsProtected: and(
    'isAttached',
    'dataset.dataIsProtected',
  ),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  metadataIsProtected: and(
    'isAttached',
    'dataset.metadataIsProtected',
  ),

  actions: {
    async toggleDatasetProtectionFlag(flag, state) {
      const {
        dataset,
        datasetManager,
        updateOpenedFileData,
      } = this.getProperties('dataset', 'datasetManager', 'updateOpenedFileData');
      await datasetManager.toggleDatasetProtectionFlag(
        dataset,
        flag,
        state
      );
      try {
        // just in case that invocation of this function fails
        // do not wait for resolve - it's only a side effect
        if (typeof updateOpenedFileData === 'function') {
          get(dataset, 'rootFile').then(file => {
            updateOpenedFileData({ fileInvokingUpdate: file });
          });
        }
      } catch (error) {
        console.error(
          'components:file-datasets/dataset-item: could not invoke updateOpenedFileData',
          error
        );
      }
    },
  },
});
