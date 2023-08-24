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
      if (!Array.isArray(this.fileRequirements)) {
        return;
      }
      this.fileRequirementRegistry.setRequirements(
        this.consumer,
        this.fileRequirements
      );
    }
  ),

  usedFilesObserver: observer(
    'usedFiles',
    function usedFilesObserver() {
      if (!Array.isArray(this.usedFiles)) {
        return;
      }
      this.fileRecordRegistry.setFiles(
        this.consumer,
        ...this.usedFiles
      );
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
