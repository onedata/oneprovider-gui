// FIXME: refactor - maybe names should be dataset instead of browsableDataset mixed with dataset

/**
 * Container for browsing and managing datasets.
 *
 * @module component/content-space-datasets
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import EmberObject, { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { getSpaceIdFromFileId } from 'oneprovider-gui/models/file';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { promise, raw, bool } from 'ember-awesome-macros';
import { resolve } from 'rsvp';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';
import BrowsableDataset from 'oneprovider-gui/utils/browsable-dataset';
import DatasetBrowserModel from 'oneprovider-gui/utils/dataset-browser-model';

const spaceDatasetsRootId = 'spaceDatasetsRoot';

const SpaceDatasetsRootBaseClass = EmberObject.extend({
  // dataset-like properties
  id: spaceDatasetsRootId,
  entityId: spaceDatasetsRootId,
  parent: promise.object(raw(resolve(null))),
  hasParent: false,
  protectionFlags: Object.freeze([]),
  rootFile: promise.object(raw(resolve(null))),
  rootFilePath: '/',
  rootFileType: 'dir',

  // special properties
  isDatasetsRoot: true,

  // virtual properties
  name: undefined,
  state: undefined,
});

const SpaceDatasetsRootClass = BrowsableDataset.extend({
  content: SpaceDatasetsRootBaseClass.create(),
});

const mixins = [
  I18n,
  ContentSpaceBaseMixin,
];

export default OneEmbeddedComponent.extend(...mixins, {
  classNames: ['content-space-datasets'],

  /**
   * @override
   */
  i18nPrefix: 'components.contentSpaceDatasets',

  datasetManager: service(),
  spaceManager: service(),
  globalNotify: service(),

  /**
   * **Injected from parent frame.**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * **Injected from parent frame.**
   * @virtual optional
   * @type {String}
   */
  datasetId: undefined,

  /**
   * **Injected from parent frame.**
   * @virtual optional
   * @type {Array<String>}
   */
  selectedDatasetsIds: undefined,

  /**
   * @virtual optional
   * @type {Function}
   */
  containerScrollTop: notImplementedIgnore,

  /**
   * @override
   */
  iframeInjectedProperties: Object.freeze([
    'spaceId',
    'datasetId',
    'selectedDatasetsIds',
  ]),

  _window: window,

  /**
   * One of: 'attached', 'detached'
   * @type {String}
   */
  selectedDatasetsState: 'attached',

  /**
   * Default value set on init.
   * @type {Array<Utils.BrowsableDataset>}
   */
  selectedDatasets: undefined,

  spaceProxy: promise.object(computed('spaceId', function spaceProxy() {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.getSpace(spaceId);
  })),

  space: reads('spaceProxy.content'),

  /**
   * @type {ComputedProperty<Object>}
   */
  spacePrivileges: reads('space.privileges'),

  /**
   * NOTE: observing only space, because it should reload initial dir after whole space
   * change.
   * @type {PromiseObject<Models.File>}
   */
  initialBrowsableDatasetProxy: promise.object(computed(
    'spaceProxy',
    'selectedDatasetsState',
    function initialBrowsableDatasetProxy() {
      return this.get('browsableDatasetProxy');
    }
  )),

  spaceDatasetsRoot: computed(
    'space',
    'selectedDatasetsState',
    function spaceDatasetsRoot() {
      const {
        space,
        selectedDatasetsState,
      } = this.getProperties('space', 'selectedDatasetsState');
      return SpaceDatasetsRootClass.create({
        name: space ? get(space, 'name') : this.t('space'),
        selectedDatasetsState,
      });
    }
  ),

  isInRoot: bool('browsableDataset.isDatasetsRoot'),

  /**
   * @type {ComputedProperty<PromiseObject<Models.Dataset>>}
   */
  browsableDatasetProxy: promise.object(computed(
    'datasetId',
    'spaceId',
    'spaceDatasetsRoot',
    async function datasetProxy() {
      const {
        datasetManager,
        globalNotify,
        datasetId,
        spaceId,
        spaceDatasetsRoot,
      } = this.getProperties(
        'datasetManager',
        'globalNotify',
        'datasetId',
        'spaceId',
        'spaceDatasetsRoot',
      );

      let isValidDatasetEntityId;
      try {
        isValidDatasetEntityId = datasetId &&
          getSpaceIdFromFileId(datasetId) === spaceId;
      } catch (error) {
        isValidDatasetEntityId = false;
      }
      if (isValidDatasetEntityId) {
        try {
          const dataset = await datasetManager.getDataset(datasetId);
          // return only dir-type datasets, for files try to return parent or null
          if (get(dataset, 'rootFileType') === 'dir') {
            return BrowsableDataset.create({ content: dataset });
          } else {
            const parent = await get(dataset, 'parent');
            return parent && BrowsableDataset.create({ content: parent }) ||
              spaceDatasetsRoot;
          }
        } catch (error) {
          globalNotify.backendError(this.t('openingDataset'), error);
          return spaceDatasetsRoot;
        }
      } else {
        return spaceDatasetsRoot;
      }
    }
  )),

  /**
   * @type {Models.Dataset}
   */
  browsableDataset: computedLastProxyContent('browsableDatasetProxy'),

  initialRequiredDataProxy: promise.object(promise.all(
    'spaceProxy',
    'initialBrowsableDatasetProxy'
  )),

  spaceIdObserver: observer('spaceId', function spaceIdObserver() {
    this.get('containerScrollTop')(0);
  }),

  //#region FIXME: wireframe for testing

  datasetPathProxy: promise.object(computed('datasetProxy.content', async function datasetPath() {
    const ds = await this.get('datasetProxy');
    if (ds) {
      return resolveFilePath(ds);
    }
  })),

  pathStringProxy: promise.object(computed('datasetPathProxy.content', async function pathString() {
    const dp = this.get('datasetPathProxy.content');
    if (dp) {
      return stringifyFilePath(dp);
    }
  })),

  childrenProxy: promise.object(computed(
    'dataset',
    async function childrenProxy() {
      const {
        dataset,
        datasetManager,
        spaceId,
        datasetId,
        selectedDatasetsState,
      } = this.getProperties(
        'dataset',
        'datasetManager',
        'spaceId',
        'datasetId',
        'selectedDatasetsState'
      );
      const isDatasetsRoot = get(dataset, 'isDatasetsRoot');

      const parentType = isDatasetsRoot ? 'space' : 'dataset';
      const parentId = isDatasetsRoot ? spaceId : datasetId;
      const { childrenRecords } = await datasetManager.fetchChildrenDatasets({
        parentType,
        parentId,
        state: selectedDatasetsState,
        index: null,
        limit: 50,
        offset: 0,
      });
      return childrenRecords;
    }
  )),

  //#endregion

  selectedDatasetsStateObserver: observer(
    'selectedDatasetsState',
    function selectedDatasetsStateObserver() {
      this.set(
        'browserModel.selectedDatasetsState',
        this.get('selectedDatasetsState'),
      );
    }
  ),

  // FIXME: selectedDatasetsState is too similar to selectedDatasets
  init() {
    this._super(...arguments);
    this.set('browserModel', this.createBrowserModel());
    if (!this.get('selectedDatasets')) {
      this.set('selectedDatasets', []);
    }
    this.selectedDatasetsStateObserver();
  },

  /**
   * @param {Object} options
   * @returns {String} Onezone URL for directory in file browser
   */
  getDataUrl(options) {
    return this.callParent('getDataUrl', options);
  },

  createBrowserModel() {
    const selectedDatasetsState = this.get('selectedDatasetsState');
    return DatasetBrowserModel.create({
      ownerSource: this,
      getDataUrl: this.getDataUrl.bind(this),
      selectedDatasetsState,
      openDatasetsModal: this.openDatasetsModal.bind(this),
    });
  },

  async fetchSpaceDatasets(rootId, startIndex, size, offset, array) {
    if (rootId !== spaceDatasetsRootId) {
      throw new Error(
        'component:content-space-datasets#fetchRootChildren: cannot use fetchRootChildren for non-root'
      );
    }
    const {
      datasetManager,
      spaceId,
      selectedDatasetsState,
    } = this.getProperties(
      'datasetManager',
      'spaceId',
      'selectedDatasetsState'
    );
    if (startIndex == null) {
      if (size <= 0 || offset < 0) {
        return resolve({ childrenRecords: [], isLast: true });
      } else {
        return this.browserizeDatasets(await datasetManager.fetchChildrenDatasets({
          parentType: 'space',
          parentId: spaceId,
          state: selectedDatasetsState,
          limit: size,
          offset,
        }));
      }
    } else if (startIndex === array.get('sourceArray.lastObject.index')) {
      return resolve({ childrenRecords: [], isLast: true });
    } else {
      throw new Error(
        'component:content-space-datasets#fetchRootChildren: illegal fetch arguments for virtual root dir'
      );
    }
  },

  async fetchDatasetChildren(datasetId, startIndex, size, offset) {
    const {
      datasetManager,
      selectedDatasetsState,
    } = this.getProperties(
      'datasetManager',
      'selectedDatasetsState',
    );
    return this.browserizeDatasets(await datasetManager.fetchChildrenDatasets({
      parentType: 'dataset',
      parentId: datasetId,
      state: selectedDatasetsState,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  // FIXME: change name and refactor usages
  browserizeDatasets({ childrenRecords, isLast }) {
    return {
      childrenRecords: childrenRecords.map(r => BrowsableDataset.create({ content: r })),
      isLast,
    };
  },

  resolveFileParentFun(dataset) {
    if (get(dataset, 'entityId') === spaceDatasetsRootId) {
      return resolve(null);
    } else if (!get(dataset, 'hasParent')) {
      return resolve(this.get('spaceDatasetsRoot'));
    } else {
      return get(dataset, 'parent');
    }
  },

  openDatasetsModal(file) {
    this.set('filesToShowDatasets', [file]);
  },

  closeDatasetsModal() {
    this.set('filesToShowDatasets', null);
  },

  actions: {
    /**
     * **Parent iframe action**
     * @param {String} datasetId
     */
    updateDatasetId(datasetId) {
      this.callParent('updateDatasetId', datasetId);
    },
    changeSelectedDatasets(selectedDatasets) {
      this.set('selectedDatasets', selectedDatasets);
    },
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
  },
});
