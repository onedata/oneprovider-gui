import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  classNames: ['visual-edm'],

  /**
   * FIXME: proper type
   * @type {Utils.EdmViewModel}
   * @virtual
   */
  viewModel: undefined,

  edmMetadata: reads('viewModel.edmMetadata'),
});
