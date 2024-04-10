/**
 * Table body with list of ancestor datasets.
 * The list is collapsible and have a summary on the collapse header.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { reads, equal } from '@ember/object/computed';
import { computed } from '@ember/object';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { conditional, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  tagName: 'tbody',
  classNames: ['dataset-protection-ancestor-datasets', 'datasets-table-tbody'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.datasetProtection.ancestorDatasets',

  /**
   * @type {'file'|'dataset'}
   */
  mode: 'dataset',

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
   * @virtual
   * @type {Function}
   */
  updateOpenedFileData: notImplementedWarn,

  /**
   * If true, ancestors entries will be collapsed on init.
   * @type {boolean}
   */
  ancestorsInitiallyCollapsed: true,

  /**
   * Used for resolving file paths in "file" mode.
   * @virtual optional
   * @type {Function}
   */
  getDataUrl: notImplementedWarn,

  /**
   * Used for resolving dataset paths in "dataset" mode.
   * @virtual optional
   * @type {Function}
   */
  getDatasetsUrl: notImplementedWarn,

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
    equal('mode', 'file'),
    raw('browser-directory'),
    raw('browser-dataset')
  ),

  init() {
    this._super(...arguments);
    const ancestorsInitiallyCollapsed = this.get('ancestorsInitiallyCollapsed');
    this.set('ancestorDatasetsCollapsed', ancestorsInitiallyCollapsed);
  },

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
