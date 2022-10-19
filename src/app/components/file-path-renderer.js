/**
 * Renders tokenized file path using prepared `pathItems`.
 *
 * Typically no to use directly, but through components generating `pathItems`, eg.
 * `file-path` or `formatted-path-string`.
 * Components that are using `file-path-renderer` should provide `pathItems` property and
 * wrap the renderer into:
 *
 * ```
 * <div class="file-path-base">
 *   <div class="path">
 *     {{file-path-renderer pathItems=pathItems}}
 *   </div>
 * </div>
 * ```
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import Component from '@ember/component';
import { directorySeparator as rawDirectorySeparator } from 'onedata-gui-common/utils/file';

/**
 * @typedef {Object} FilePathItem
 * @property {'ellipsis'|'dataset'|'archive'|'space'|'file'} itemType
 * @property {string} separator
 * @property {{ name: string}} record A file record or some object that provides a name.
 * @property {string} [icon]
 * @property {boolean} [isFirst]
 * @property {boolean} [isLast]
 */

export const datasetSeparator = '›';
export const directorySeparator = rawDirectorySeparator;
export const ellipsisString = '...';

export default Component.extend({
  tagName: '',

  /**
   * @virtual
   * @type {Array<FilePathItem>}
   */
  pathItems: undefined,
});
