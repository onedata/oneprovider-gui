import Component from '@ember/component';
import { computed } from '@ember/object';
import { getIsInArchivePath, getArchiveRelativeFilePath } from 'oneprovider-gui/utils/file-archive-info';

// FIXME: generic
const directorySeparator = '/';
const datasetSeparator = '›';

export default Component.extend({
  classNames: ['file-path'],

  /**
   * @type {string}
   */
  absolutePath: undefined,

  browsableArchive: undefined,

  pathItems: computed(function pathItems() {
    const stringPath = this.absolutePath.startsWith(directorySeparator) ?
      this.absolutePath.slice(1) : this.absolutePath;
    const items = [];
    const allFileNames = stringPath.split(directorySeparator);
    const simpleFilePath = allFileNames.map(name => new SimpleFile(name));
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
  }),

  defaultArchiveItem: computed(function defaultArchiveItem() {
    return new SimpleFile('Archive');
  }),
});

class SimpleFile {
  constructor(name) {
    this.name = name;
  }
}
