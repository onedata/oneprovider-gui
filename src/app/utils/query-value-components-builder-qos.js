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
            values: get(queryProperty, 'allValues'),
          },
          initiallyFocused
        );
      }
      case 'storage.is': {
        return this.createEditorObject(
          'storage-editor', {
            values: get(queryProperty, 'allValues'),
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
