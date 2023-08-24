// FIXME: jsdoc

import Mixin from '@ember/object/mixin';
import EmberObject, { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import { reads } from '@ember/object/computed';
import FileConsumerModel from 'oneprovider-gui/utils/file-consumer-model';

// FIXME: implementacja: jeśli warunki zawierają tylko zestaw podstawowych danych, to nie trzeba rejestrować

export default Mixin.create({
  /**
   * @virtual optional
   * @type {Array<FileRequirement>}
   */
  fileRequirements: undefined,

  /**
   * @virtual optional
   * @type {Array<Models.File>}
   */
  usedFiles: undefined,

  /**
   * @override
   * @type {Array<FileRequirement>}
   */
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
      this.fileConsumerModel.destroy();
    } finally {
      this._super(...arguments);
    }
  },
});
