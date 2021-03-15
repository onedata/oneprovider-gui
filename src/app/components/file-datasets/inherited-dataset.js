/**
 * Entry with information about an effective dataset for file/directory. 
 *
 * @module components/file-datasets/inherited-dataset
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw } from 'ember-awesome-macros';
import { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import computedT from 'onedata-gui-common/utils/computed-t';
import { hasProtectionFlag } from 'oneprovider-gui/utils/dataset-tools';

export default Component.extend(I18n, {
  classNames: ['inherited-dataset'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.inheritedDataset',

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
   * @virtual
   * @type {Function}
   */
  close: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

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
  isDataProtected: hasProtectionFlag('dataset.protectionFlags', 'data'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isMetadataProtected: hasProtectionFlag('dataset.protectionFlags', 'metadata'),

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
    fileLinkClicked(event) {
      this.get('close')();
      event.stopPropagation();
    },
  },
});
