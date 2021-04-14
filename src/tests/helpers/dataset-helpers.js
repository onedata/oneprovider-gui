/**
 * Test utils for datasets.
 *
 * @module tests/helpers/dataset-helpers
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import { promiseArray } from 'onedata-gui-common/utils/ember/promise-array';
import { get } from '@ember/object';

export function createFileDatasetSummary({
  directDataset = null,
  effAncestorDatasets = [],
} = {}) {
  return {
    getRelation(relation) {
      if (relation === 'directDataset') {
        return promiseObject(resolve(directDataset));
      }
    },
    belongsTo(relation) {
      if (relation === 'directDataset') {
        return {
          id: () => directDataset ? get(directDataset, 'id') : null,
          async load() {
            return directDataset;
          },
          async reload() {
            return directDataset;
          },
        };
      }
    },
    hasMany(relation) {
      if (relation === 'effAncestorDatasets') {
        return {
          load() {
            return promiseArray(resolve(effAncestorDatasets));
          },
          reload() {
            return promiseArray(resolve(effAncestorDatasets));
          },
        };
      }
    },
  };
}
