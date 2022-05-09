// FIXME: implement all actions or remove file
// FIXME: jdsoc

import EmberObject from '@ember/object';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import CopyDatasetIdAction from './actions/copy-dataset-id-action';

export default EmberObject.extend(OwnerInjector, {
  /**
   * @virtual
   * @type {Models.Dataset}
   */
  dataset: undefined,

  createCopyDatasetIdAction(context) {
    return CopyDatasetIdAction.create({
      ownerSource: this,
      context,
    });
  },
});
