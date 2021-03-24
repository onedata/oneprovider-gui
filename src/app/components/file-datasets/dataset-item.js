/**
 * Entry with information about an effective dataset for file/directory. 
 *
 * @module components/file-datasets/dataset-item
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, and } from 'ember-awesome-macros';
import { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import computedT from 'onedata-gui-common/utils/computed-t';
import { inject as service } from '@ember/service';

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

  // TODO: VFS-7404 below computed properties with classes, text and icons are not
  // refactored because they can be not necessary when new design will be implemented

  /**
   * @type {ComputedProperty<String>}
   */
  dataFlagIcon: conditional(
    'isDataProtected',
    'enabledIcon',
    'disabledIcon',
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  dataFlagLabelText: conditional(
    'isDataProtected',
    computedT('writeProtection.data.enabled'),
    computedT('writeProtection.data.disabled'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  flagDataRowClass: conditional(
    'isDataProtected',
    raw('enabled'),
    raw('disabled'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  metadataFlagIcon: conditional(
    'isMetadataProtected',
    'enabledIcon',
    'disabledIcon',
  ),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  metadataFlagLabelText: conditional(
    'isMetadataProtected',
    computedT('writeProtection.metadata.enabled'),
    computedT('writeProtection.metadata.disabled'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  flagMetadataRowClass: conditional(
    'isMetadataProtected',
    raw('enabled'),
    raw('disabled'),
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
