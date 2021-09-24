/**
 * A file-browser view for managing dataset for file or directory.
 * Contains dataset settings with protection settings and archives browser.
 *
 * @module components/file-datasets
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { collect, raw, conditional, and } from 'ember-awesome-macros';
import { guidFor } from '@ember/object/internals';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  // file-datasets is mainly used inside modal, but we cannot use element tag as a parent
  // of modal elements (header/body/footer)
  tagName: '',

  i18n: service(),
  datasetManager: service(),
  fileManager: service(),
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileDatasets',

  /**
   * @type {Models.Space}
   * @virtual
   */
  space: undefined,

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
   * See eg. parent-action `getDatsetUrl` in `component:content-space-datasets`
   * @type {Function}
   */
  getDatasetsUrl: notImplementedIgnore,

  /**
   * @virtual
   * @type {Array<Models.File>}
   */
  files: undefined,

  /**
   * Selector of modal that is parent of this component (if modal is used).
   * @virtual optional
   * @type {String}
   */
  parentModalDialogSelector: undefined,

  /**
   * Stores load error if fileDatasetSummary could not be loaded.
   * It can be cleared to try again fetching.
   * @type {String}
   */
  fileDatasetSummaryLoadError: null,

  /**
   * One of: settings, archives
   * @type {String}
   */
  activeTab: 'settings',

  modalBodyId: computed(function modalBodyId() {
    return `${guidFor(this)}-body`;
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
      computedRelationErrorProperty: 'fileDatasetSummaryLoadError',
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

  disabledTabs: conditional(
    and('fileDatasetSummaryProxy.isFulfilled', 'hasDirectDatasetEstablished'),
    collect(),
    collect(raw('archives')),
  ),

  settingsTabHint: computedT('tabHints.settings'),

  archivesTabHint: conditional(
    'hasDirectDatasetEstablished',
    computedT('tabHints.archives.enabled'),
    computedT('tabHints.archives.notEstablished'),
  ),
});
