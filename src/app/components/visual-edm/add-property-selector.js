/**
 * FIXME: doc
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend(I18n, {
  classNames: ['space-tags-selector-editor', 'tags-input-selector-editor'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.visualEdm.addPropertySelector',

  /**
   * @virtual
   * @type {EdmObject}
   */
  edmObjectModel: undefined,

  opened: false,

  onPropertyAdd: undefined,

  triggerSelector: undefined,

  //#region state

  /**
   * @type {string}
   */
  filterValue: '',

  //#endregion

  availableEdmPropertiesSpecs: computed(function availableEdmPropertiesSpecs() {
    return [
      'Contributor to the creation of the original object',
      'Creator of the model',
      'Description',
      '3D format',
      'Internal ID',
      'Language of inscriptions in the object',
      'URL for paradata',
      'Copyright',
      'Subject',
      'Title',
      'Type of object',
      'Creation date of the original object',
      'Dimensions with units',
      'URL for raw data',
      'Parent entity (collection, object, site…)',
      'Material',
      'Original location',
      'Current location',
      'Content provider institution',
      'Representative image',
      'Copyright licence URL of the original object',
      'Asset type',
    ].map(label => ({ label }));
    // return [{
    //     namespace: 'dc',
    //     name: 'contributor',
    //     label: 'Contributor to the creation of the original object',
    //   },
    //   {
    //     namespace: 'dc',
    //     name: 'description',
    //     label: 'Description',
    //   },
    // ];
  }),

  /**
   * This component does not have any additional settings. `settings` field is
   * defined to provide editor API compatible with the one expected by the
   * tags input.
   * @virtual optional
   * @type {Object}
   */
  settings: undefined,

  /**
   * @type {Object}
   */
  popoverApi: undefined,

  repositionPopover() {
    this.popoverApi.reposition();
  },

  actions: {
    propertySelected( /*propertySpec*/ ) {
      // FIXME: implement
    },
  },
});
