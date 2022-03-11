import Component from '@ember/component';

export default Component.extend({
  /**
   * @virtual
   * @type {models/file}
   */
  file: undefined,

  /**
   * @virtual optional
   * @type {Models.Space}
   */
  space: undefined,
});
