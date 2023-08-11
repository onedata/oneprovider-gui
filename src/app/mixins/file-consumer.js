// FIXME: jsdoc

import Mixin from '@ember/object/mixin';
import EmberObject, { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

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

  // FIXME: później można zamknąć dane mixinu w obiekcie
});

/**
 * A logic controlling file-requirements auto add/remove from global registry for
 * a FileConsumer (`consumer` property).
 */
const FileConsumerModel = EmberObject.extend(OwnerInjector, {
  fileRequirementRegistry: service(),

  /**
   * @virtual
   * @type {FileConsumer}
   */
  consumer: undefined,

  fileRequirementsObserver: observer(
    'consumer.fileRequirements',
    function fileRequirementsObserver() {
      this.fileRequirementRegistry.setRequirements(
        this.consumer,
        this.consumer.fileRequirements ?? []
      );
    }
  ),

  /**
   * @override
   */
  init() {
    this._super(...arguments);
    this.fileRequirementsObserver();
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.fileRequirementRegistry.removeRequirements(this.consumer);
    } finally {
      this._super(...arguments);
    }
  },
});
