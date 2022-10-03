/**
 * A modal with various details about an archive.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { computed } from '@ember/object';
import { guidFor } from '@ember/object/internals';

/**
 * @typedef {'properties'} ArchiveDetailsModalTabId
 */

/**
 * Contains global (like `initialTab`) and per-tab options for modal.
 * @typedef {Object} ArchiveDetailsModalOptions
 * @property {ArchiveDetailsModalTabId} initialTab
 * @property {ArchivePropertiesTabOptions} properties Options for "properties" tab.
 */

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),
  archiveManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archivePropertiesModal',

  /**
   * @virtual
   * @type {Boolean}
   */
  open: false,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * An archive for which info will be displayed or modified.
   * @virtual
   * @type {Utils.BrowsableArchive}
   */
  browsableArchive: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHide: notImplementedIgnore,

  /**
   * @type {}
   */
  initialTab: undefined,

  /**
   * @virtual optional
   * @type {ArchiveDetailsModalOptions}
   */
  options: undefined,

  /**
   * @type {ArchiveDetailsModalTabId}
   */
  activeTab: 'properties',

  /**
   * @type {Array<ArchiveDetailsModalTabId>}
   */
  availableTabs: Object.freeze(['properties', 'logs']),

  modalId: computed(function modalId() {
    return `archive-details-modal-${guidFor(this)}`;
  }),

  init() {
    this._super(...arguments);
    const initialTab = this.initialTab;
    const availableTabs = this.availableTabs;
    this.changeTab(initialTab);
    if (!this.activeTab) {
      this.changeTab(availableTabs[0]);
    }
  },

  onShown() {
    if (this.options?.properties?.focusDescription) {
      const modalId = this.get('modalId');
      /** @type {HTMLElement} */
      const descriptionInput =
        document.querySelector(`#${modalId} .description-field .form-control`);
      if (descriptionInput) {
        descriptionInput.focus();
        descriptionInput.select();
      }
    }
  },

  /**
   * @param {ArchiveDetailsModalTabId} tabId
   * @returns {void}
   */
  changeTab(tabId) {
    if (this.availableTabs.includes(tabId)) {
      this.set('activeTab', tabId);
    }
  },

  actions: {
    hide() {
      this.get('onHide')();
    },
    onShown() {
      this.onShown();
    },
    /**
     *
     * @param {ArchiveDetailsModalTabId} tabId
     */
    changeTab(tabId) {
      this.changeTab(tabId);
    },
  },
});
