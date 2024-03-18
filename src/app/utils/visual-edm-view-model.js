// FIXME: refaktor - lepiej: utils/visual-edm/view-model

import EmberObject, { observer } from '@ember/object';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import { reads } from '@ember/object/computed';
import ObjectViewModel from './visual-edm/object-view-model';
import EdmObjectType from './edm/object-type';
import _ from 'lodash';
import EdmObjectFactory from './edm/object-factory';
import EdmMetadataFactory from './edm/metadata-factory';

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

  model: reads('edmMetadata'),

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
      const factory = EdmMetadataFactory.create();
      this.set(
        'edmMetadata',
        this.xmlValue ?
        factory.fromXml(this.xmlValue) : factory.createInitialMetadata()
      );
    }

    this.edmMetadataObserver();
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
    const factory = EdmMetadataFactory.create();
    this.set('edmMetadata', factory.fromXml(this.xmlValue));
  },

  async updateView() {
    this.notifyPropertyChange('edmMetadata');
    await waitForRender();
  },

  addWebResource() {
    const factory = new EdmObjectFactory(this.edmMetadata);
    this.edmMetadata.edmObjects = [
      ...this.edmMetadata.edmObjects,
      factory.createObject(EdmObjectType.WebResource),
    ];
    this.updateView();
  },

  /**
   * @param {EdmObject} object
   */
  deleteObject(object) {
    this.edmMetadata.edmObjects = _.without(this.edmMetadata.edmObjects, object);
    this.updateView();
  },
});

export default VisualEdmViewModel;
