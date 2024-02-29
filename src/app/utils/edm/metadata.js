import EmberObject from '@ember/object';

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
});

export default EdmMetadata;
