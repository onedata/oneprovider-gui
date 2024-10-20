/**
 * A modal that allows to select one or more Onedata records (groups, providers, etc.).
 *
 * @author Michał Borzęcki
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/i18n';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { ResourceListItem } from 'onedata-gui-common/components/resources-list';

/**
 * @typedef {Object} RecordListSelectorModalOptions
 * @property {PromiseObject<RecordListContainer<GraphSingleModel>>} recordListContainer
 * @property {boolean} allowMany
 * @property {SafeString} header
 * @property {SafeString} [subheader]
 * @property {SafeString} [listHeader]
 * @property {SafeString} [incompleteListText]
 * @property {SafeString} [incompleteListTipText]
 */

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.recordListSelectorModal',

  /**
   * @virtual
   * @type {string}
   */
  modalId: undefined,

  /**
   * Is described in the file header
   * @virtual
   * @type {RecordListSelectorModalOptions}
   */
  modalOptions: undefined,

  /**
   * @type {Array<GraphSingleModel>}
   */
  selectedRecords: undefined,

  /**
   * @type {Map<GraphSingleModel, ResourceListItem>}
   */
  listItemsCache: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<RecordListContainer<GraphSingleModel>>>}
   */
  recordListContainer: reads('modalOptions.recordListContainer'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  allowMany: reads('modalOptions.allowMany'),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  header: reads('modalOptions.header'),

  /**
   * @type {ComputedProperty<SafeString | undefined>}
   */
  subheader: reads('modalOptions.subheader'),

  /**
   * @type {ComputedProperty<SafeString | undefined>}
   */
  listHeader: reads('modalOptions.listHeader'),

  /**
   * @type {ComputedProperty<SafeString | undefined>}
   */
  incompleteListText: reads('modalOptions.incompleteListText'),

  /**
   * @type {ComputedProperty<SafeString | undefined>}
   */
  incompleteListTipText: reads('modalOptions.incompleteListTipText'),

  /**
   * @type {ComputedProperty<ResourceListItem>}
   */
  listItems: computed('recordListContainer.content.records.[]', function listItems() {
    const { listItemsCache } = this;
    return this.recordListContainer?.content?.records?.map((record) => {
      const listItem = listItemsCache.get(record);
      if (listItem) {
        return listItem;
      }

      const newListItem = ResourceListItem.create({ record });
      listItemsCache.set(record, newListItem);
      return newListItem;
    }) ?? [];
  }),

  /**
   * @override
   */
  init() {
    this._super(...arguments);
    this.setProperties({
      selectedRecords: [],
      listItemsCache: new Map(),
    });
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      for (const listItem of this.listItemsCache.values()) {
        listItem.destroy();
      }
    } finally {
      this._super(...arguments);
    }
  },

  actions: {
    selectionChanged(selectedItems) {
      this.set('selectedRecords', selectedItems.map(({ record }) => record));
    },
  },
});
