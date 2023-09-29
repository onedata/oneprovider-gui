/**
 * A logic controlling file-requirements auto add/remove from global registry for
 * a FileConsumer (`consumer` property).
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { reads } from '@ember/object/computed';
import isFileRecord from 'oneprovider-gui/utils/is-file-record';

export default EmberObject.extend(OwnerInjector, {
  fileRequirementRegistry: service(),
  fileRecordRegistry: service(),

  /**
   * @virtual
   * @type {FileConsumer}
   */
  consumer: undefined,

  fileRequirements: reads('consumer.fileRequirements'),

  consumerUsedFiles: reads('consumer.usedFiles'),

  usedFiles: computed('consumerUsedFiles', function usedFiles() {
    return this.consumerUsedFiles?.filter(file => {
      if (!isFileRecord(file)) {
        console.warn(
          `file-consumer-model: one of file consumer usedFiles is not a file: "${file}", consumer:`,
          this.consumer,
        );
        return false;
      }
      return !file.isDestroyed && !file.isDestroying;
    });
  }),

  fileRequirementsObserver: observer(
    'fileRequirements',
    function fileRequirementsObserver() {
      this.registerRequirements();
    }
  ),

  usedFilesObserver: observer(
    'usedFiles',
    function usedFilesObserver() {
      this.registerUsedFiles();
    }
  ),

  /**
   * @override
   */
  init() {
    this._super(...arguments);
    this.fileRequirementsObserver();
    this.usedFilesObserver();
  },

  registerRequirements() {
    if (!Array.isArray(this.fileRequirements) || !this.fileRequirements.length) {
      this.fileRequirementRegistry.deregisterRequirements(this.consumer);
      return;
    }
    this.fileRequirementRegistry.setRequirements(
      this.consumer,
      ...this.fileRequirements
    );
  },

  registerUsedFiles() {
    if (!Array.isArray(this.usedFiles) || !this.usedFiles.length) {
      this.fileRecordRegistry.deregisterFiles(this.consumer);
      return;
    }
    this.fileRecordRegistry.setFiles(
      this.consumer,
      ...this.usedFiles
    );
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.fileRequirementRegistry.deregisterRequirements(this.consumer);
      this.fileRecordRegistry.deregisterFiles(this.consumer);
    } finally {
      this._super(...arguments);
    }
  },
});
