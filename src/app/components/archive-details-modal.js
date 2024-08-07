/**
 * A modal with various details about an archive.
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/i18n';
import { computed, observer } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import ArchivePropertiesViewModel from 'oneprovider-gui/utils/archive-properties-view-model';

/**
 * @typedef {'properties'|'logs'} ArchiveDetailsModalTabId
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
  i18nPrefix: 'components.archiveDetailsModal',

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
   * @virtual optional
   * @type {ArchiveDetailsModalOptions}
   */
  options: undefined,

  /**
   * @type {ArchiveDetailsModalTabId}
   */
  activeTab: null,

  /**
   * @type {Array<ArchiveDetailsModalTabId>}
   */
  availableTabs: Object.freeze(['properties', 'logs']),

  modalId: computed(function modalId() {
    return `archive-details-modal-${guidFor(this)}`;
  }),

  /**
   * Initialized in `changeTab` -> `createArchivePropertiesViewModel`.
   * Recomputed if needed in `createArchivePropertiesViewModel`.
   * @type {Utils.ArchivePropertiesViewModel}
   */
  archivePropertiesViewModel: null,

  archivePropertiesViewModelReloader: observer(
    'browsableArchive',
    'space',
    'options.properties',
    function archivePropertiesViewModelReloader() {
      this.destroyArchivePropertiesViewModel();
      this.createArchivePropertiesViewModel();
    }
  ),

  init() {
    this._super(...arguments);
    const initialTab = this.options?.initialTab;
    if (initialTab) {
      (async () => {
        await this.changeTab(initialTab);
        if (!this.activeTab) {
          await this.changeTab(this.availableTabs[0]);
        }
      })();
    } else {
      this.changeTabToDefault();
    }
  },

  /**
   * @override
   */
  willDestroyElement() {
    try {
      this.destroyArchivePropertiesViewModel();
    } finally {
      this._super(...arguments);
    }
  },

  createArchivePropertiesViewModel() {
    this.destroyArchivePropertiesViewModel();
    const archivePropertiesViewModel = ArchivePropertiesViewModel.create({
      ownerSource: this,
      browsableArchive: this.browsableArchive,
      space: this.space,
      options: this.options?.properties,
    });
    this.set('archivePropertiesViewModel', archivePropertiesViewModel);
  },

  destroyArchivePropertiesViewModel() {
    this.archivePropertiesViewModel?.destroy();
  },

  async onShown() {
    if (this.activeTab === 'properties') {
      this.archivePropertiesViewModel.onShown();
    }
  },

  /**
   * True if current tab can be closed (if want to be changed or modal complete close).
   * @returns {Promise<boolean>}
   */
  async checkTabClose() {
    if (this.activeTab === 'properties') {
      return this.archivePropertiesViewModel.checkClose();
    } else {
      return true;
    }
  },

  /**
   * @param {ArchiveDetailsModalTabId} tabId
   * @returns {void}
   */
  async changeTab(tabId) {
    if (this.activeTab === tabId) {
      return;
    }
    if (
      this.availableTabs.includes(tabId) &&
      await this.checkTabClose()
    ) {
      if (tabId === 'properties') {
        this.createArchivePropertiesViewModel();
      } else {
        this.destroyArchivePropertiesViewModel();
      }
      this.set('activeTab', tabId);
    }
  },

  /**
   * @returns {Promise}
   */
  async changeTabToDefault() {
    await this.changeTab(this.availableTabs[0]);
  },

  close() {
    (async () => {
      if (await this.checkTabClose()) {
        this.onHide?.();
      }
    })();
    return false;
  },

  actions: {
    close() {
      return this.close();
    },
    onShown() {
      this.onShown();
    },
    /**
     * @param {ArchiveDetailsModalTabId} tabId
     * @returns {Promise}
     */
    async changeTab(tabId) {
      return this.changeTab(tabId);
    },
  },
});
