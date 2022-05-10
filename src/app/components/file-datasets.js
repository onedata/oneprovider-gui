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
import EmberObject, { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { computedRelationProxy } from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { or, not, conditional, and, notEmpty, promise, bool } from 'ember-awesome-macros';
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
  parentAppNavigation: service(),
  appProxy: service(),

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
   * See eg. parent-action `getDatasetUrl` in `component:content-space-datasets`
   * @type {Function}
   */
  getDatasetsUrl: notImplementedIgnore,

  /**
   * @virtual optional
   * @type {Function}
   */
  onCloseAllModals: notImplementedIgnore,

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

  // FIXME: jsdoc
  tabOptions: computed(function tabOptions() {
    return {
      archives: {},
    };
  }),

  navigateTarget: reads('parentAppNavigation.navigateTarget'),

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
   * @type {ComputedProperty<String>}
   */
  fileType: reads('file.type'),

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

  browsableDatasetProxy: promise.object(computed(
    'directDatasetProxy',
    async function browsableDatasetProxy() {
      const {
        directDatasetProxy,
        datasetManager,
      } = this.getProperties('directDatasetProxy', 'datasetManager');
      const directDataset = await directDatasetProxy;
      return datasetManager.getBrowsableDataset(directDataset);
    }
  )),

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
    async function ancestorDatasetsProxy() {
      const fileDatasetSummary = await this.get('fileDatasetSummaryProxy');
      return await fileDatasetSummary.hasMany('effAncestorDatasets').reload();
    }
  )),

  archivesTabDisabled: or(
    not('fileDatasetSummaryProxy.isFulfilled'),
    not('hasDirectDatasetEstablished'),
  ),

  belongsToSomeDatasetProxy: promise.object(computed(
    'hasDirectDatasetEstablished',
    'ancestorDatasetsProxy',
    async function belongsToSomeDatasetProxy() {
      if (this.get('hasDirectDatasetEstablished')) {
        return true;
      }
      const ancestorDatasets = await this.get('ancestorDatasetsProxy');
      return Boolean(get(ancestorDatasets, 'length'));
    }
  )),

  belongsToSomeDataset: reads('belongsToSomeDatasetProxy.content'),

  tabsSpec: computed(function tabSpecs() {
    const {
      i18n,
      i18nPrefix,
    } = this.getProperties('i18n', 'i18nPrefix');
    return [
      EmberObject.extend(I18n, {
        /**
         * @virtual
         * @type {Components.FileDatasets}
         */
        fileDatasets: undefined,

        i18n,
        i18nPrefix: i18nPrefix + '.tabs.settings',
        id: 'settings',
        label: computedT('label'),
        tip: computed('fileDatasets.fileType', function tip() {
          return this.t('tip', {
            fileType: this.t('fileType.' + this.get('fileDatasets.fileType')),
          });
        }),
        disabled: false,
      }).create({
        fileDatasets: this,
      }),
      EmberObject.extend(I18n, {
        /**
         * @virtual
         * @type {Components.FileDatasets}
         */
        fileDatasets: undefined,

        i18n,
        i18nPrefix: i18nPrefix + '.tabs.archives',
        id: 'archives',
        archiveCount: reads('fileDatasets.directDataset.archiveCount'),
        hasArchiveCount: notEmpty('archiveCount'),
        label: conditional(
          'hasArchiveCount',
          computed('archiveCount', function labelCounted() {
            return this.t('labelCounted', {
              count: this.get('archiveCount'),
            });
          }),
          computedT('label'),
        ),
        tip: and(not('disabled'), computedT('tip')),
        fullTabTip: computed('disabled', 'fileDatasets.fileType', function tip() {
          if (this.get('disabled')) {
            return this.t('tipDisabled', {
              fileType: this.t('fileType.' + this.get('fileDatasets.fileType')),
            });
          }
        }),
        disabled: reads('fileDatasets.archivesTabDisabled'),
      }).create({
        fileDatasets: this,
      }),
    ];
  }),

  fileTypeText: computed('fileType', function fileTypeText() {
    const fileType = this.get('fileType');
    return this.t(`fileType.${fileType}`);
  }),

  /**
   * Link on item text, if it has a dataset established.
   * @type {ComputedProperty<String>}
   */
  datasetLinkProxy: promise.object(computed(
    'directDatasetProxy.content.{parent,state}',
    async function datasetLinkProxy() {
      const {
        getDatasetsUrl,
        directDatasetProxy,
      } = this.getProperties('getDatasetsUrl', 'directDatasetProxy');
      const directDataset = await directDatasetProxy;
      if (directDataset) {
        const datasetId = get(directDataset, 'entityId');
        const parentId = directDataset.relationEntityId('parent');
        const options = {
          datasetId: parentId,
          selectedDatasets: [datasetId],
          attachmentState: get(directDataset, 'state'),
        };
        return getDatasetsUrl && getDatasetsUrl(options);
      }
    }
  )),

  datasetLink: reads('datasetLinkProxy.content'),

  renderFooter: bool('datasetLink'),

  async establishDirectDataset() {
    const {
      file,
      datasetManager,
      globalNotify,
    } = this.getProperties('file', 'datasetManager', 'globalNotify');
    try {
      return await datasetManager.establishDataset(file);
    } catch (error) {
      globalNotify.backendError(this.t('establishingDataset'), error);
    }
  },

  changeActiveTab(chosenTabId, tabOptions = {}) {
    const tabSpec = this.get('tabsSpec').findBy('id', chosenTabId);
    if (tabSpec && !get(tabSpec, 'disabled')) {
      this.set('activeTab', chosenTabId);
      this.set(`tabOptions.${chosenTabId}`, tabOptions);
    }
  },

  actions: {
    changeActiveTab() {
      return this.changeActiveTab(...arguments);
    },
    establishDataset() {
      return this.establishDirectDataset();
    },
    openCreateArchive() {
      this.changeActiveTab('archives', {
        actionToInvoke: {
          name: 'createArchive',
        },
      });
    },
  },
});
