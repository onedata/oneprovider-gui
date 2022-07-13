import EmberObject from '@ember/object';

export const emptyValue = { ___empty___: true };

export default EmberObject.extend({
  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,
});
