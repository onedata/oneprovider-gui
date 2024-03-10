import EmberObject, { observer } from '@ember/object';
import EdmMetadata from 'oneprovider-gui/utils/edm/metadata';

// FIXME: ta klasa jest całkowicie eksperymentalna - obecnie ważne jest tylko edmMetadata

const VisualEdmViewModel = EmberObject.extend({
  //#region dependencies

  /**
   * @virtual optional
   * @type {string}
   */
  xmlValue: undefined,

  /**
   * @virtual optional
   * @type {Utils.Edm.Metadata}
   */
  edmMetadata: undefined,

  //#endregion

  //#region state

  //#endregion

  init() {
    this._super(...arguments);
    // FIXME: coś zrobić, żeby xmlValue było respektowane jako wstrzykiwane z góry
    //  - np. zmiany, albo udokumentować odpowiednio
    if (!this.edmMetadata) {
      this.set(
        'edmMetadata',
        this.xmlValue ?
        EdmMetadata.fromXml(this.xmlValue) : EdmMetadata.createInitialMetadata()
      );
    }
  },

  updateMetadataModel() {
    // FIXME: EdmMetadata powinno mieć możliwość podmianki w sobie, a nie tylko tworzenie nowego obiektu?
    this.set('edmMetadata', EdmMetadata.fromXml(this.xmlValue));
  },
});

export default VisualEdmViewModel;
