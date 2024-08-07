/**
 * A logic controlling file-requirements auto add/remove from global registry for
 * a FileConsumer (`consumer` property).
 *
 * @author Jakub Liput
 * @copyright (C) 2023-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { reads } from '@ember/object/computed';
import { syncObserver } from 'onedata-gui-common/utils/observer';

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

  /**
   * Auto-register usedFilesGri defined in the consumer.
   *
   * Note, that this observer **MUST BE** defined before `fileRequirementsObserver` to
   * launch always before registering requirements, because this operation may reload
   * files, which must be registered in the registry.
   *
   * Synchronous observer: usedFiles are based on computed properties and there are often
   * cases when computed property triggers observers that needs the most recent used files
   * registered in the registry.
   * @type {Ember.Observer}
   */
  usedFilesObserver: syncObserver(
    'usedFileGris',
    function usedFilesObserver() {
      this.registerUsedFiles();
    }
  ),

  /**
   * Synchronous observer: fileRequirements are based on computed properties and there are
   * often cases when computed property triggers observers that needs the most recent
   * requirements registered in the registry.
   * @type {Ember.Observer}
   */
  fileRequirementsObserver: syncObserver(
    'fileRequirements',
    function fileRequirementsObserver() {
      this.registerRequirements();
    }
  ),

  /**
   * @override
   */
  init() {
    this._super(...arguments);
    this.usedFilesObserver();
    this.fileRequirementsObserver();
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
