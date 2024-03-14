import EmberObject from '@ember/object';
import EdmMetadata from 'oneprovider-gui/utils/edm/metadata';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import { reads } from '@ember/object/computed';

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

  isReadOnly: false,

  //#region state

  component: undefined,

  //#endregion

  edmObjects: reads('edmMetadata.edmObjects'),

  hasExtraData: reads('edmMetadata.hasExtraData'),

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

  /**
   * @param {Components.VisualEdm} component
   */
  mount(component) {
    this.set('component', component);
  },

  updateMetadataModel() {
    // FIXME: EdmMetadata powinno mieć możliwość podmianki w sobie, a nie tylko tworzenie nowego obiektu?
    this.set('edmMetadata', EdmMetadata.fromXml(this.xmlValue));
  },

  async updateView() {
    this.notifyPropertyChange('edmMetadata');
    await waitForRender();
  },
});

export default VisualEdmViewModel;
