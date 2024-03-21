// FIXME: refaktor - lepiej: utils/visual-edm/view-model

import EmberObject, { observer } from '@ember/object';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import { reads } from '@ember/object/computed';
import ObjectViewModel from './visual-edm/object-view-model';
import EdmObjectType from './edm/object-type';
import _ from 'lodash';
import EdmObjectFactory from './edm/object-factory';

const VisualEdmViewModel = EmberObject.extend({
  //#region dependencies

  /**
   * @virtual
   * @type {EdmMetadata}
   */
  edmMetadata: undefined,

  /**
   * @virtual
   * @type {EdmMetadataValidator}
   */
  validator: undefined,

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

  edmMetadataObserver: observer(
    'edmMetadata',
    'validator',
    function edmMetadataObserver() {
      this.set('objects', this.createObjectsViewModels());
    }
  ),

  // FIXME: raczej uprościć, żeby nie obsługiwać wstrzykiwania xmlValue, tylko sam model
  init() {
    this._super(...arguments);
    if (!this.edmMetadata) {
      throw new Error('edmMetadata must be provided for VisualEdmViewModel');
    }
    this.edmMetadataObserver();
  },

  createObjectsViewModels() {
    return this.edmMetadata.edmObjects.map(edmObject => {
      const objectValidator = this.validator?.objectValidators.find(v =>
        v.edmObject === edmObject
      );
      return ObjectViewModel.create({
        visualEdmViewModel: this,
        validator: objectValidator,
        model: edmObject,
      });
    });
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
