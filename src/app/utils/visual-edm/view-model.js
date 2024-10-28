/**
 * Model for `VisualEdm` component associated with `EdmMetadata` model.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed } from '@ember/object';
import waitForRender from 'onedata-gui-common/utils/wait-for-render';
import { reads } from '@ember/object/computed';
import ObjectViewModel from './object-view-model';
import EdmObjectType from '../edm/object-type';
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

  /**
   * @virtual optional
   * @type {Models.File}
   */
  shareRootFile: undefined,

  //#endregion

  isRepresentativeImageShown: false,

  isReadOnly: false,

  isDisabled: false,

  //#region state

  component: undefined,

  /**
   * @type {Array<Utils.VisualEdm.ObjectViewModel>}
   */
  prevObjects: undefined,

  /**
   * @type {boolean}
   */
  isModified: false,

  //#endregion

  model: reads('edmMetadata'),

  edmObjects: reads('edmMetadata.edmObjects'),

  hasExtraData: reads('edmMetadata.hasExtraData'),

  /**
   * @type {ComputedProperty<Array<Utils.VisualEdm.ObjectViewModel>>}
   */
  objects: computed(
    'edmMetadata',
    'validator',
    function objects() {
      const newObjects = this.createObjectsViewModels();
      this.destroyPrevObjects();
      // TODO: VFS-12215 remove legacy side-effects
      // eslint-disable-next-line ember/no-side-effects
      this.set('prevObjects', newObjects);
      return newObjects;
    }
  ),

  representativeImageReference: computed(
    'edmMetadata',
    function representativeImageReference() {
      return this.edmMetadata.getRepresentativeImageReference();
    }
  ),

  digitalObjectsViewModels: computed(
    'objects.[]',
    function digitalObjectsViewModels() {
      return this.objects.filter(obj => obj.edmObjectType === EdmObjectType.WebResource);
    }
  ),

  choViewModels: computed(
    'objects.[]',
    function choViewModels() {
      return this.objects.filter(obj => obj.edmObjectType === EdmObjectType.ProvidedCHO);
    }
  ),

  aggregationViewModels: computed(
    'objects.[]',
    function aggregationViewModels() {
      return this.objects.filter(obj => obj.edmObjectType === EdmObjectType.Aggregation);
    }
  ),

  init() {
    this._super(...arguments);
    if (!this.edmMetadata) {
      throw new Error('edmMetadata must be provided for VisualEdmViewModel');
    }
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.destroyPrevObjects();
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

  markAsModified(isModified = true) {
    if (this.isModified !== isModified) {
      this.set('isModified', isModified);
    }
  },

  /**
   * @param {EdmObject} object
   */
  deleteObject(object) {
    if (this.isReadOnly || this.isDisabled) {
      return;
    }
    this.edmMetadata.deleteObject(object);
    this.validator?.updateValue();
    this.markAsModified();
    this.updateView();
  },

  destroyPrevObjects() {
    if (!this.prevObjects) {
      return;
    }
    for (const object of this.prevObjects) {
      try {
        object?.destroy();
      } catch {
        // ignore
      }
    }
  },
});

export default VisualEdmViewModel;
