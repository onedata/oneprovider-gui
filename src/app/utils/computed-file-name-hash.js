/**
 * Creates `fileNameHash` property, which exposes file name hash generated using
 * DuplicateNameHashMapper and file property (typically a path) unique in the hash mapper
 * instance.
 *
 * Needs a `duplicateNameHashMapper: DuplicateNameHashMapper` property defined in object.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';
import {
  defaultSeparator as nameConflictSeparator,
} from 'onedata-gui-common/components/name-conflict';

/**
 * @param {string} fileUniqueProperty Name of property that is unique for files set.
 *   Typically a property with path or relative path of file.
 * @returns {string}
 */
export default function computedFileNameHash(fileUniqueProperty) {
  return computed(
    fileUniqueProperty,
    'duplicateNameHashMapper.hashMapping',
    function fileNameHash() {
      const hashMapping = this.duplicateNameHashMapper.hashMapping;
      if (!this[fileUniqueProperty]) {
        return '';
      }
      const hash = hashMapping[this[fileUniqueProperty]];
      return hash ? (nameConflictSeparator + hash) : '';
    }
  );
}
