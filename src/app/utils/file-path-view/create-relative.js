// FIXME: jsdoc

import { directorySeparator } from 'oneprovider-gui/components/file-path-renderer';

export default function createRelative(stringPath) {
  const allFileNames = stringPath.split(directorySeparator);
  const simpleFilePath = allFileNames.map(name => ({ name }));
  const items = simpleFilePath.map(simpleFile => {
    return {
      itemType: 'file',
      separator: directorySeparator,
      record: simpleFile,
    };
  });
  if (items[0]) {
    delete items[0].separator;
  }
  return items;
}
