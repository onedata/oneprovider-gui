/**
 * Model for `VisualEdm` component associated with `EdmMetadata` model.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { observer } from '@ember/object';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import { reads } from '@ember/object/computed';
import ObjectViewModel from './object-view-model';
import EdmObjectType from '../edm/object-type';
import EdmObjectFactory from '../edm/object-factory';
import { sortObjects } from '../edm/sort';

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

  init() {
    this._super(...arguments);
    if (!this.edmMetadata) {
      throw new Error('edmMetadata must be provided for VisualEdmViewModel');
    }
    this.edmMetadataObserver();
  },

  createObjectsViewModels() {
    return sortObjects(this.edmMetadata.edmObjects).map(edmObject => {
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
    const object = factory.createInitialObject(EdmObjectType.WebResource);
    this.edmMetadata.addObject(object);
    this.validator?.updateValue();
    this.updateView();
  },

  /**
   * @param {EdmObject} object
   */
  deleteObject(object) {
    this.edmMetadata.deleteObject(object);
    this.updateView();
  },
});

export default VisualEdmViewModel;
