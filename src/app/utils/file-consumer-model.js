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

  consumerUsedFileGris: reads('consumer.usedFileGris'),

  usedFileGris: reads('consumerUsedFileGris'),

  fileRequirementsObserver: observer(
    'fileRequirements',
    function fileRequirementsObserver() {
      this.registerRequirements();
    }
  ),

  usedFilesObserver: observer(
    'usedFileGris',
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
    if (!Array.isArray(this.usedFileGris) || !this.usedFileGris.length) {
      this.fileRecordRegistry.deregisterFileGris(this.consumer);
      return;
    }
    this.fileRecordRegistry.setFileGris(
      this.consumer,
      ...this.usedFileGris
    );
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.fileRequirementRegistry.deregisterRequirements(this.consumer);
      this.fileRecordRegistry.deregisterFileGris(this.consumer);
    } finally {
      this._super(...arguments);
    }
  },
});
