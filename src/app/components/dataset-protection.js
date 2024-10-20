/**
 * Summarizes and allows to change dataset protection settings and protection of its
 * ancestors.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { promise } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.datasetProtection',

  // file-datasets is mainly used inside modal, but we cannot use element tag as a parent
  // of modal elements (header/body/footer)
  tagName: '',

  i18n: service(),

  /**
   * @virtual optional
   * @type {Boolean}
   */
  editPrivilege: true,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  close: notImplementedIgnore,

  /**
   * @virtual
   * Callback to generate URL to file (here: selecting the file).
   * See eg. parent-action `getDataUrl` in `component:content-file-browser`
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  /**
   * @virtual
   * Callback to generate URL to dataset (here: selecting the dataset).
   * See eg. parent-action `getDatasetUrl` in `component:content-space-datasets`
   * @type {Function}
   */
  getDatasetsUrl: notImplementedIgnore,

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @virtual
   * @type {Utils.BrowsableDataset}
   */
  browsableDataset: undefined,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  showBrowseDatasetsLink: true,

  /**
   * @type {PromiseObject<Utils.BrowsableDataset>}
   */
  directDatasetProxy: promise.object(promise.resolve('browsableDataset')),

  /**
   * Text displayed in various places when settings cannot be edited due to lack of
   * privileges.
   * @type {ComputedProperty<SafeString>}
   */
  insufficientEditPrivilegesMessage: computed(
    function insufficientEditPrivilegesMessage() {
      return insufficientPrivilegesMessage({
        i18n: this.get('i18n'),
        modelName: 'space',
        privilegeFlag: 'space_manage_datasets',
      });
    }
  ),

  /**
   * @type {ComputedProperty<PromiseObject<Models.FileDatasetSummary>>}
   */
  fileDatasetSummaryProxy: computedRelationProxy(
    'file',
    'fileDatasetSummary',
    Object.freeze({
      reload: true,
      computedRelationErrorProperty: 'fileDatasetSummaryLoadError',
    })
  ),

  /**
   * @type {ComputedProperty<PromiseArray<Models.Dataset>>}
   */
  ancestorDatasetsProxy: promise.array(computed(
    'fileDatasetSummaryProxy',
    async function ancestorDatasetsProxy() {
      const fileDatasetSummary = await this.get('fileDatasetSummaryProxy');
      return await fileDatasetSummary.hasMany('effAncestorDatasets').reload();
    }
  )),

  /**
   * @type {ComputedProperty<Models.FileDatasetSummary>}
   */
  fileDatasetSummary: reads('fileDatasetSummaryProxy.content'),
});
