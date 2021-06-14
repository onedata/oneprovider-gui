/**
 * Implementation of settings, logic and state for selectors browsing datasets tree.
 *
 * @module utils/items-select-browser/dataset-model
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseModel from './base-model';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import SelectorDatasetBrowserModel from 'oneprovider-gui/utils/selector-dataset-browser-model';
import { promise, or, not, equal, raw, conditional } from 'ember-awesome-macros';
import BrowsableDataset from 'oneprovider-gui/utils/browsable-dataset';
import {
  spaceDatasetsRootId,
  SpaceDatasetsRootClass,
} from 'oneprovider-gui/components/content-space-datasets';
import { inject as service } from '@ember/service';
import computedT from 'onedata-gui-common/utils/computed-t';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default BaseModel.extend(I18n, {
  datasetManager: service(),
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'utils.itemsSelectBrowser.datasetModel',

  /**
   * @virtual optional
   */
  attachmentState: 'attached',

  /**
   * @override
   */
  browserModel: computed(function browserModel() {
    return SelectorDatasetBrowserModel.create({
      ownerSource: this,
      onSubmitSingleItem: this.get('onSubmitSingleItem'),
    });
  }),

  /**
   * @override
   */
  dirProxy: promise.object(computed(
    'dirId',
    'spaceDatasetsRoot',
    async function dirProxy() {
      const {
        datasetManager,
        dirId,
        spaceDatasetsRoot,
        spaceId,
      } = this.getProperties(
        'datasetManager',
        'dirId',
        'spaceDatasetsRoot',
        'spaceId',
      );

      if (dirId) {
        if (dirId === spaceDatasetsRootId) {
          return spaceDatasetsRoot;
        }
        const dataset = await datasetManager.getDataset(dirId);
        let isValidDatasetEntityId;
        try {
          isValidDatasetEntityId = dirId &&
            get(dataset, 'spaceId') === spaceId;
        } catch (error) {
          console.error(
            'util:items-select-browser/dataset-model#dirProxy: error getting spaceId from dataset:',
            error
          );
          isValidDatasetEntityId = false;
        }
        if (!isValidDatasetEntityId) {
          return spaceDatasetsRoot;
        }
        return BrowsableDataset.create({ content: dataset });
      } else {
        return spaceDatasetsRoot;
      }
    }
  )),

  /**
   * @override
   */
  itemTypeText: conditional(
    equal('maxItems', raw(1)),
    computedT('dataset.single'),
    computedT('dataset.multi')
  ),

  spaceDatasetsRoot: computed(
    'space',
    'attachmentState',
    function spaceDatasetsRoot() {
      const {
        space,
        attachmentState,
      } = this.getProperties('space', 'attachmentState');
      return SpaceDatasetsRootClass.create({
        name: space ? get(space, 'name') : '',
        attachmentState,
      });
    }
  ),

  spaceId: reads('space.entityId'),

  isInRoot: computed('dirId', function isInRoot() {
    const dirId = this.get('dirId');
    return !dirId || dirId === spaceDatasetsRootId;
  }),

  /**
   * @override
   */
  async resolveItemParent(item) {
    if (get(item, 'entityId') === spaceDatasetsRootId) {
      return null;
    } else if (!get(item, 'hasParent')) {
      return this.get('spaceDatasetsRoot');
    } else {
      return get(item, 'parent');
    }
  },

  /**
   * @override
   */
  async fetchChildren(...fetchArgs) {
    const isInRoot = this.get('isInRoot');
    if (isInRoot) {
      return this.fetchSpaceDatasets(...fetchArgs);
    } else {
      return this.fetchDatasetChildren(...fetchArgs);
    }
  },

  async fetchDatasetChildren(datasetId, startIndex, size, offset) {
    const {
      datasetManager,
      attachmentState,
    } = this.getProperties(
      'datasetManager',
      'attachmentState',
    );
    return this.browserizeDatasets(await datasetManager.fetchChildrenDatasets({
      parentType: 'dataset',
      parentId: datasetId,
      state: attachmentState,
      index: startIndex,
      limit: size,
      offset,
    }));
  },

  async fetchSpaceDatasets(rootId, startIndex, size, offset, array) {
    if (rootId !== spaceDatasetsRootId) {
      throw new Error(
        'util:items-select-browser/dataset-model#fetchSpaceDatasets: cannot use fetchRootChildren for non-root'
      );
    }
    const {
      datasetManager,
      spaceId,
      attachmentState,
    } = this.getProperties(
      'datasetManager',
      'spaceId',
      'attachmentState'
    );
    if (startIndex == null) {
      if (size <= 0 || offset < 0) {
        return this.getEmptyFetchChildrenResponse();
      } else {
        return this.browserizeDatasets(await datasetManager.fetchChildrenDatasets({
          parentType: 'space',
          parentId: spaceId,
          state: attachmentState,
          limit: size,
          offset,
        }));
      }
    } else if (startIndex === array.get('sourceArray.lastObject.index')) {
      return this.getEmptyFetchChildrenResponse();
    } else {
      throw new Error(
        'util:items-select-browser/dataset-model#fetchSpaceDatasets: illegal fetch arguments for virtual root dir'
      );
    }
  },

  getEmptyFetchChildrenResponse() {
    return {
      childrenRecords: [],
      isLast: true,
    };
  },

  browserizeDatasets({ childrenRecords, isLast }) {
    return {
      childrenRecords: childrenRecords.map(r => BrowsableDataset.create({ content: r })),
      isLast,
    };
  },
});
