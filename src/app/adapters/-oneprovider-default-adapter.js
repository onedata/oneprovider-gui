import Adapter from './application';

export default Adapter.extend({
  /**
   * @override
   */
  subscribe: false,

  /**
   * @override
   */
  createScope: 'private',

  /**
   * @override
   */
  entityTypeToModelNameMap: Object.freeze(new Map([
    ['op_file', 'file'],
    ['file', 'file'],
    ['op_group', 'group'],
    ['op_space', 'space'],
    ['op_transfer', 'transfer'],
    ['op_user', 'user'],
  ])),
});
