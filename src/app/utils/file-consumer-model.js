/**
 * A logic controlling file-requirements auto add/remove from global registry for
 * a FileConsumer (`consumer` property).
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { reads } from '@ember/object/computed';

export default EmberObject.extend(OwnerInjector, {
  fileRequirementRegistry: service(),
  fileRecordRegistry: service(),

  /**
   * @virtual
   * @type {FileConsumer}
   */
  consumer: undefined,

  fileRequirements: reads('consumer.fileRequirements'),

  usedFiles: reads('consumer.usedFiles'),

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
    if (!Array.isArray(this.fileRequirements)) {
      return;
    }
    this.fileRequirementRegistry.setRequirements(
      this.consumer,
      this.fileRequirements
    );
  },

  registerUsedFiles() {
    if (!Array.isArray(this.usedFiles)) {
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
      this.fileRequirementRegistry.removeRequirements(this.consumer);
      this.fileRecordRegistry.removeFiles(this.consumer);
    } finally {
      this._super(...arguments);
    }
  },
});
