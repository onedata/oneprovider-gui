import EmberObject from '@ember/object';
import { reads } from '@ember/object/computed';

const ObjectViewModel = EmberObject.extend({
  /**
   * @virtual
   * @type {Utils.VisualEdmViewModel}
   */
  visualEdmViewModel: undefined,

  /**
   * @virtual
   * @type {EdmObject}
   */
  model: undefined,

  edmProperties: reads('model.edmProperties'),
});

export default ObjectViewModel;
