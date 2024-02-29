import EdmObject, { EdmObjectType } from '../object';

export default EdmObject.extend({
  edmObjectType: EdmObjectType.Aggregation,
  xmlNamespace: 'ore',
});
