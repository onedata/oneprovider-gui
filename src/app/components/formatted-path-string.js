/**
 * Presents file path string in formatted manner.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import { getIsInArchivePath, getArchiveRelativeFilePath } from 'oneprovider-gui/utils/file-archive-info';
import { directorySeparator } from 'oneprovider-gui/components/file-path-renderer';
import I18n from 'onedata-gui-common/mixins/i18n';

export default Component.extend(I18n, {
  classNames: ['formatted-path-string', 'file-path-base'],

  /**
   * @override
   */
  i18nPrefix: 'components.formattedPathString',

  /**
   * Absolute string path to file, eg. `/space_name/hello/world/foo.txt`
   * @virtual
   * @type {string}
   */
  absolutePath: undefined,

  /**
   * Optional instance of archive to display its information when file is inside archive.
   * @virtual optional
   * @type {Utils.browsableArchive}
   */
  browsableArchive: undefined,

  /**
   * @type {ComputedProperty<Array<FilePathItem>>}
   */
  pathItems: computed(
    'absolutePath',
    'browsableArchive',
    'defaultArchiveItem',
    function pathItems() {
      const stringPath = this.absolutePath.startsWith(directorySeparator) ?
        this.absolutePath.slice(1) : this.absolutePath;
      const items = [];
      const allFileNames = stringPath.split(directorySeparator);
      const simpleFilePath = allFileNames.map(name => new SimpleFileInfo(name));
      const isInArchive = getIsInArchivePath(simpleFilePath);
      const spaceRootDir = simpleFilePath[0];
      let remainSimpleFiles = simpleFilePath;
      if (isInArchive) {
        items.push({
          itemType: 'archive',
          icon: 'browser-archive',
          record: this.browsableArchive || this.defaultArchiveItem,
        });
        remainSimpleFiles = getArchiveRelativeFilePath(remainSimpleFiles);
      } else {
        items.push({
          itemType: 'space',
          icon: 'space',
          record: spaceRootDir,
        });
        remainSimpleFiles = remainSimpleFiles.slice(1);
      }
      const regularItems = remainSimpleFiles.map(simpleFile => {
        return {
          itemType: 'file',
          separator: directorySeparator,
          record: simpleFile,
        };
      });
      items.push(...regularItems);
      return items;
    }
  ),

  /**
   * Fallback archive item if there is no `browsableArchive` provided.
   * @type {SimpleFileInfo}
   */
  defaultArchiveItem: computed(function defaultArchiveItem() {
    return new SimpleFileInfo(this.t('archive'));
  }),
});

class SimpleFileInfo {
  constructor(name) {
    this.name = name;
  }
}
