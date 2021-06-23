/**
 * Table body with list of ancestor datasets.
 * The list is collapsible and have a summary on the collapse header. 
 *
 * @module componensts/file-datasets/ancestor-datasets
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { conditional, equal, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  tagName: 'tbody',
  classNames: ['file-datasets-ancestor-datasets', 'datasets-table-tbody'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets.ancestorDatasets',

  /**
   * @virtual
   * @type {Function}
   */
  close: notImplementedWarn,

  /**
   * @virtual
   * @type {PromiseArray<Models.Dataset>}
   */
  ancestorDatasetsProxy: undefined,

  /**
   * @virtual
   * @type {String}
   */
  fileType: 'file',

  /**
   * Mapping of protection type to icon name
   * @virtual
   * @type {Object}
   */
  protectionIcons: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  getDataUrl: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  updateOpenedFileData: notImplementedWarn,

  /**
   * Where file links should open
   * @type {String}
   */
  navigateDataTarget: '_top',

  /**
   * State of parent datasets collapse
   * @type {Boolean}
   */
  ancestorDatasetsCollapsed: true,

  /**
   * @type {ComputedProperty<Array<Models.Dataset>>}
   */
  ancestorDatasets: reads('ancestorDatasetsProxy.content'),

  /**
   * A dataset-like object that have summary of parent datasets protection flags
   * @type {ComputedProperty<Object>}
   */
  virtualParentDataset: computed(
    'ancestorDatasets.@each.{dataIsProtected,metadataIsProtected}',
    function virtualParentDataset() {
      const ancestorDatasets = this.get('ancestorDatasets');
      if (ancestorDatasets) {
        return {
          isAttached: true,
          dataIsProtected: ancestorDatasets.isAny('dataIsProtected'),
          metadataIsProtected: ancestorDatasets.isAny('metadataIsProtected'),
        };
      }
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  ancestorIcon: conditional(
    equal('mode', raw('file')),
    raw('browser-directory'),
    raw('browser-dataset')
  ),

  actions: {
    toggleParentDatasetsCollapse() {
      this.toggleProperty('ancestorDatasetsCollapsed');
    },
    ancestorLinkClicked(event) {
      this.get('close')();
      event.stopPropagation();
    },
  },
});