// FIXME: jsdoc

import Mixin from '@ember/object/mixin';
import EmberObject, { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { reads } from '@ember/object/computed';

// FIXME: implementacja: jeśli warunki zawierają tylko zestaw podstawowych danych, to nie trzeba rejestrować

export default Mixin.create({
  /**
   * @override
   */
  init() {
    this._super(...arguments);
    this.fileConsumer = FileConsumerModel.create({
      consumer: this,
      ownerSource: this,
    });
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.fileConsumer.destroy();
    } finally {
      this._super(...arguments);
    }
  },
});

/**
 * A logic controlling file-requirements auto add/remove from global registry for
 * a FileConsumer (`consumer` property).
 */
const FileConsumerModel = EmberObject.extend(OwnerInjector, {
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
      this.fileRequirementRegistry.setRequirements(
        this.consumer,
        this.fileRequirements ?? []
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
