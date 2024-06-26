/**
 * A mixin that adds auto-registering of declared `fileRequirements` and `usedFileGris`
 * into `FileRequirementRegistry` and `FileRecordRegistry` services.
 *
 * The mixin should be implemented by entities (components, etc.) that use files and need
 * non-basic properties (see `basicProperties` property of the `FileRequirementRegistry`
 * service) and want the used files to be auto-updated when requirements are changed.
 * To achieve that, you should implemenent `fileRequirements` and `usedFileGris` to return
 * array of requirements and file GRIs accordingly.
 *
 * The object implementing this mixin should have an owner. The mixin adds internal
 * `fileConsumerModel` that handles collections changes to register requirements and
 * files.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Mixin from '@ember/object/mixin';
import FileConsumerModel from 'oneprovider-gui/utils/file-consumer-model';
import { get, computed } from '@ember/object';

export default Mixin.create({
  /**
   * @virtual optional
   * @type {Array<FileRequirement>}
   */
  fileRequirements: undefined,

  /**
   * @virtual optional
   * @type {Array<string>}
   */
  usedFileGris: undefined,

  /**
   * @type {Utils.FileConsumerModel}
   */
  fileConsumerModel: undefined,

  init() {
    this._super(...arguments);
    this.fileConsumerModel = FileConsumerModel.create({
      consumer: this,
      ownerSource: this,
    });
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.fileConsumerModel?.destroy();
    } finally {
      this._super(...arguments);
    }
  },
});

export function computedSingleUsedFileGri(singleFileProperty) {
  return computed(singleFileProperty, function usedFileGris() {
    const usedFileGri = this[singleFileProperty] && this.get(`${singleFileProperty}.id`);
    return usedFileGri ? [usedFileGri] : [];
  });
}

export function computedMultiUsedFileGris(fileArrayProperty) {
  return computed(fileArrayProperty, function usedFileGris() {
    const usedFileGris = this[fileArrayProperty] &&
      this[fileArrayProperty].map(file => get(file, 'id'));
    return usedFileGris ?? [];
  });
}
