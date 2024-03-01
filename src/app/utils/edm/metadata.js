import EmberObject from '@ember/object';
import EdmXmlGenerator from './xml-generator';

const EdmMetadata = EmberObject.extend({
  //#region state

  // FIXME: type EdmObject
  /**
   * @type {Array<EdmObject>}
   */
  edmObjects: undefined,

  //#endregion

  init() {
    this._super(...arguments);
    if (!Array.isArray(this.edmObjects)) {
      this.set('edmObjects', []);
    }
  },

  stringify() {
    return new EdmXmlGenerator(this).generateXml();
  },
});

export default EdmMetadata;
