import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['items-select-browser-footer'],

  /**
   * @override
   */
  i18nPrefix: 'components.itemsSelectBrowser.footer',

  /**
   * @virtual optional
   */
  validationError: undefined,

  /**
   * @virtual
   */
  onCancel: notImplementedIgnore,

  /**
   * @virtual
   */
  onSubmit: notImplementedIgnore,

  selectedCount: reads('selectedItems.length'),

  itemsSelectedText: computed('selectedCount', function itemsSelectedText() {
    const selectedCount = this.get('selectedCount');
    let key;
    if (selectedCount && typeof selectedCount === 'number' && selectedCount > 0) {
      if (selectedCount === 1) {
        key = 'single';
      } else {
        key = 'multi';
      }
    } else {
      key = 'none';
    }
    return this.t(`itemsSelected.${key}`, {
      count: selectedCount,
    });
  }),
});
