// FIXME: refaktor - lepiej: utils/visual-edm/view-model

import EmberObject, { observer } from '@ember/object';
import EdmMetadata from 'oneprovider-gui/utils/edm/metadata';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import { reads } from '@ember/object/computed';
import ObjectViewModel from './visual-edm/object-view-model';
import EdmObjectType from './edm/object-type';

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

  /**
   * @type {Array<Utils.VisualEdm.ObjectViewModel>}
   */
  objects: undefined,

  edmMetadataObserver: observer('edmMetadata', function edmMetadataObserver() {
    this.set('objects', this.createObjectsViewModels());
  }),

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

    this.set('objects', this.createObjectsViewModels());
  },

  createObjectsViewModels() {
    return this.edmMetadata.edmObjects.map(edmObject => {
      return ObjectViewModel.create({
        visualEdmViewModel: this,
        model: edmObject,
      });
    });
  },

  updateMetadataModel() {
    // FIXME: EdmMetadata powinno mieć możliwość podmianki w sobie, a nie tylko tworzenie nowego obiektu?
    this.set('edmMetadata', EdmMetadata.fromXml(this.xmlValue));
  },

  async updateView() {
    this.notifyPropertyChange('edmMetadata');
    await waitForRender();
  },

  addWebResource() {
    const factory = EdmMetadataFactory.create();
    this.edmMetadata.edmObjects = [
      ...this.edmMetadata.edmObjects,
      factory.createObject(this.edmMetadata, EdmObjectType.WebResource),
    ];
    this.updateView();
  },
});

export default VisualEdmViewModel;
