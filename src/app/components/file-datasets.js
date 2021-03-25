/**
 * Main component for managing datasets for file or directory.
 * 
 * Currently used in file-browser wrapped with one-modal.
 *
 * @module components/file-datasets
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { promise } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  // file-datasets is mainly used inside modal, but we cannot use element tag as a parent
  // of modal elements (header/body/footer)
  tagName: '',

  i18n: service(),
  datasetManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets',

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
   * See parent-action `getDataUrl` in `component:content-file-browser`
   * @type {Function}
   */
  getDataUrl: notImplementedIgnore,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  protectionIcons: Object.freeze({
    data: 'provider',
    metadata: 'browser-attribute',
  }),

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
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('files.firstObject'),

  /**
   * @type {ComputedProperty<PromiseObject<Models.FileDatasetSummary>>}
   */
  fileDatasetSummaryProxy: computedRelationProxy(
    'file',
    'fileDatasetSummary',
    Object.freeze({
      reload: true,
    })
  ),

  /**
   * @type {ComputedProperty<Models.FileDatasetSummary>}
   */
  fileDatasetSummary: reads('fileDatasetSummaryProxy.content'),
  /**
   * @type {ComputedProperty<PromiseObject<Models.Dataset>>}
   */
  directDatasetProxy: computedRelationProxy(
    'fileDatasetSummary',
    'directDataset',
    Object.freeze({
      allowNull: true,
      reload: true,
    })
  ),

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  directDataset: reads('directDatasetProxy.content'),

  /**
   * Valid (non-undefined) only if fileDatasetSummaryProxy is settled
   * @type {ComputedProperty<Boolean>}
   */
  hasDirectDatasetEstablished: computed(
    'fileDatasetSummary.directDataset.content',
    function hasDirectDatasetEstablished() {
      const fileDatasetSummary = this.get('fileDatasetSummary');
      if (fileDatasetSummary) {
        return Boolean(fileDatasetSummary.belongsTo('directDataset').id());
      }
    }
  ),

  /**
   * @type {ComputedProperty<PromiseArray<Models.Dataset>>}
   */
  ancestorDatasetsProxy: promise.array(computed(
    'fileDatasetSummaryProxy',
    async function ancestorDatasets() {
      const fileDatasetSummary = await this.get('fileDatasetSummaryProxy');
      return await get(fileDatasetSummary, 'effectiveAncestorDatasets');
      // TODO: VFS-7414 there are problems with reloading hasMany relation while
      // fileDatasetSummary record is loaded on localstorage adapter (mock)
      // check it on real backend adapter and find the solution to serve always fresh
      // effectiveAncestorDatasets array
      // return await fileDatasetSummary.hasMany('effectiveAncestorDatasets').reload();
    }
  )),

  /**
   * @type {ComputedProperty<Models.Dataset>}
   */
  ancestorDatasets: reads('ancestorDatasetsProxy.content'),
});
