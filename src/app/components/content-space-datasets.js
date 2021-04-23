/**
 * Container for browsing and managing datasets.
 *
 * @module component/content-space-datasets
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
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
import { promise, raw } from 'ember-awesome-macros';
import { resolve, reject } from 'rsvp';
import computedLastProxyContent from 'onedata-gui-common/utils/computed-last-proxy-content';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';

const spaceDatasetsRootId = 'spaceDatasetsRoot';

const SpaceDatasetsRoot = EmberObject.extend({
  // mock of dataset
  id: spaceDatasetsRootId,
  entityId: spaceDatasetsRootId,
  type: 'dir',
  isShareRoot: true,
  hasParent: false,
  parent: promise.object(raw(resolve(null))),
  protectionFlags: Object.freeze([]),
  rootFile: promise.object(raw(reject(new Error(
    'component:content-space-datasets: tried to get rootFile of virtual space datasets root'
  )))),
  rootFilePath: '/',
  rootFileType: 'dir',

  // special properties
  isDatasetsRoot: true,

  // virtual properties
  state: undefined,
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

  spaceProxy: promise.object(computed('spaceId', function spaceProxy() {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.getSpace(spaceId);
  })),

  /**
   * @type {ComputedProperty<Object>}
   */
  spacePrivileges: reads('spaceProxy.content.privileges'),

  /**
   * NOTE: observing only space, because it should reload initial dir after whole space
   * change.
   * @type {PromiseObject<Models.File>}
   */
  initialDatasetProxy: promise.object(computed(
    'spaceProxy',
    function initialDatasetProxy() {
      return this.get('datasetProxy');
    }
  )),

  spaceDatasetsRoot: computed(
    'selectedDatasetsState',
    function spaceDatasetsRoot() {
      return SpaceDatasetsRoot.create({
        state: this.get('selectedDatasetsState'),
      });
    }
  ),

  /**
   * @type {ComputedProperty<PromiseObject<Models.Dataset>>}
   */
  datasetProxy: promise.object(computed(
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
            return dataset;
          } else {
            const parent = await get(dataset, 'parent');
            return parent || spaceDatasetsRoot;
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
  dataset: computedLastProxyContent('datasetProxy'),

  initialRequiredDataProxy: promise.object(promise.all(
    'spaceProxy',
    'initialDatasetProxy'
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

  actions: {
    // FIXME: should be used with file-browser, otherwise - remove
    containerScrollTop() {
      return this.get('containerScrollTop')(...arguments);
    },
    openDatasetsModal(files) {
      this.set('filesToShowDatasets', files);
    },
    closeDatasetsModal() {
      this.closeDatasetsModal();
    },

    /**
     * **Parent iframe action**
     * @param {String} datasetId
     */
    updateDatasetId(datasetId) {
      this.callParent('updateDatasetId', datasetId);
    },

    // FIXME: should be used with file-browser, otherwise - remove
    /**
     * **Parent iframe action**
     * @param {Object} data
     * @param {String} data.fileId entity id of directory to open
     * @param {String|Array<String>} data.selected list of entity ids of files
     *  to be selected on view
     * @returns {String}
     */
    getDataUrl(data) {
      return this.callParent('getDataUrl', data);
    },
  },
});
