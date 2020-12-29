/**
 * Extenstion of values builder (`OnedataGuiCommon/Utils/QueryValueComponentsBuilder`)
 * that adds support for storage (storageId) and provider (providerId) QoS parameters.
 * Should be used in QoS expression editor.
 * 
 * @module utils/query-value-components-builder-qos
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import QueryValueComponentsBuilder from 'onedata-gui-common/utils/query-value-components-builder';
import { get } from '@ember/object';

export default QueryValueComponentsBuilder.extend({
  /**
   * @override
   */
  getComparatorsFor(propertyType) {
    switch (propertyType) {
      case 'provider':
        return ['provider.is'];
      case 'storage':
        return ['storage.is'];
      default:
        return this._super(...arguments);
    }
  },

  /**
   * @override
   */
  getValidatorFor(comparator) {
    switch (comparator) {
      case 'provider.is':
      case 'storage.is':
        return (value) => value && get(value, 'entityId');
      default:
        return this._super(...arguments);
    }
  },

  /**
   * @override
   */
  getEditorFor(comparator, queryProperty, initiallyFocused = false) {
    switch (comparator) {
      case 'provider.is': {
        return this.createEditorObject(
          'provider-editor', {
            values: get(queryProperty, 'allValues').sortBy('name'),
          },
          initiallyFocused
        );
      }
      case 'storage.is': {
        return this.createEditorObject(
          'storage-editor', {
            values: get(queryProperty, 'allValues').sortBy('name'),
          },
          initiallyFocused
        );
      }
      default:
        return this._super(...arguments);
    }
  },

  /**
   * @override
   */
  getPresenterFor(comparator) {
    switch (comparator) {
      case 'provider.is':
        return 'provider-presenter';
      case 'storage.is':
        return 'storage-presenter';
      default:
        return this._super(...arguments);
    }
  },
});
