import EmberObject from '@ember/object';
import EdmXmlGenerator from './xml-generator';

const EdmMetadata = EmberObject.extend({
  //#region state

  // FIXME: type EdmObject
  /**
   * @type {Array<EdmObject>}
   */
  edmObjects: undefined,

  /**
   * True if metadata has been generated from XML containing unknown data beside
   * supported data (eg. extra objects).
   * @type {boolean}
   */
  hasExtraData: false,

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
