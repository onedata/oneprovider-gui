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
import { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
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
   * See result format of `util:resolve-file-path` for details
   * @virtual
   * @type {Array<Models.File>}
   */
  filePath: Object.freeze([]),

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
  getDataUrl: notImplementedIgnore,

  /**
   * Mapping of protection type (data or metadata) to name of icon representing it
   * @virtual
   * @type {Object}
   */
  protectionIcons: undefined,

  /**
   * Name of icon for enabled flag
   * @type {String}
   */
  enabledIcon: 'checked',

  /**
   * Name of icon for disabled flag
   * @type {String}
   */
  disabledIcon: 'x',

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('filePath.lastObject'),

  /**
   * @type {ComputedProperty<String>}
   */
  filePathString: computed('filePath.@each.name', function filePathString() {
    return stringifyFilePath(this.get('filePath'));
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  fileHref: computed('getDataUrl', 'file.entityId', function fileHref() {
    const {
      getDataUrl,
      file,
    } = this.getProperties('getDataUrl', 'file');
    const fileId = get(file, 'entityId');
    return getDataUrl({ fileId: null, selected: [fileId] });
  }),

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
    toggleDatasetProtectionFlag(flag, state) {
      const {
        dataset,
        datasetManager,
      } = this.getProperties('dataset', 'datasetManager');
      return datasetManager.toggleDatasetProtectionFlag(
        dataset,
        flag,
        state
      );
    },
    fileLinkClicked(event) {
      this.get('close')();
      event.stopPropagation();
    },
  },
});
