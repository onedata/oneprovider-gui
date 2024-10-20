/**
 * Container for all transfer tables in space transfers view
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { resolve } from 'rsvp';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import I18n from 'onedata-gui-common/mixins/i18n';

const basicTabs = Object.freeze(['waiting', 'ongoing', 'ended']);
const prioritisedBasicTabs = Object.freeze(['ongoing', 'waiting', 'ended']);
const allTabs = [].concat('file', basicTabs);
const defaultTab = prioritisedBasicTabs[0];

export default Component.extend(I18n, {
  classNames: ['tables-container'],

  i18n: service(),
  store: service(),
  transferManager: service(),
  fileManager: service(),

  i18nPrefix: 'components.spaceTransfers',

  /**
   * @virtual
   * File EntityId which tab should be redered
   * @type {String}
   */
  fileId: undefined,

  /**
   * @virtual
   * @type {String} one of: file, waiting, ongoing, ended
   */
  tab: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  changeListTab: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  closeFileTab: notImplementedWarn,

  forbiddenOperations: computed(
    'space.privileges.{scheduleReplication,scheduleEviction,cancelReplication,cancelEviction}',
    function forbiddenOperations() {
      const privileges = this.get('space.privileges');
      if (privileges) {
        return {
          scheduleReplication: privileges.scheduleReplication === false,
          scheduleEviction: privileges.scheduleEviction === false,
          cancelReplication: privileges.cancelReplication === false,
          cancelEviction: privileges.cancelEviction === false,
        };
      } else {
        return {};
      }
    },
  ),

  /**
   * Returns tab name if it is allowed and null otherwise.
   * @type {String}
   */
  verifiedTab: computed('tab', 'fileId', function verifiedTab() {
    const {
      tab,
      fileId,
    } = this.getProperties('tab', 'fileId');
    return (fileId ? allTabs : basicTabs).includes(tab) ? tab : defaultTab;
  }),

  tabIds: computed('fileId', function tabIds() {
    return this.get('fileId') ? allTabs : basicTabs;
  }),

  /**
   * @type {ListWatcher}
   * Initialized in `didInsertElement`
   */
  listWatcher: undefined,

  listLocked: false,

  /**
   * Holds tab ID that was opened recently.
   * It should be cleared if some operations after opening has been done.
   * @type {string|null}
   */
  tabJustChangedId: null,

  /**
   * @type {ComputedProperty<models.File>}
   */
  file: reads('fileProxy.content'),

  /**
   * Name of icon to use in file tab
   * @type {ComputedProperty<string>}
   */
  fileTabIcon: computed(
    'file.type',
    function fileTabIcon() {
      switch (this.get('file.type')) {
        case 'file':
          return 'browser-file';
        case 'dir':
          return 'browser-directory';
        default:
          return 'unknown';
      }
    }
  ),

  /**
   * Hint string for file tab
   * @type {ComputedProperty<string>}
   */
  fileTabHint: computed(
    'file.type',
    function fileTabHint() {
      return this.t('fileTabHint', {
        type: this.t('fileTabHintType.' + (this.get('file.type') || 'unknown')),
      });
    }
  ),

  /**
   * A file record for which a special tab will be rendered.
   * If no `fileId` is provided - undefined.
   * If file is broken - rejects.
   * @type {ComputedProperty<PromiseObject<models.File>>|undefined}
   */
  fileProxy: promise.object(computed(
    'fileId',
    function fileProxy() {
      const {
        fileManager,
        fileId,
      } = this.getProperties('fileManager', 'fileId');
      if (fileId) {
        return fileManager.getFileById(fileId)
          .then(record => {
            if (get(record, 'type') === 'broken') {
              throw { message: 'not_found' };
            } else {
              return record;
            }
          });
      }
    }
  )),

  /**
   * @type {ComputedProperty<PromiseObject<string>>}
   */
  initialTabProxy: promise.object(computed(function initialTabProxy() {
    const {
      tab,
      fileId,
    } = this.getProperties('tab', 'fileId');
    const tabDefinedValid = tab && (tab === 'file' &&
      fileId) || basicTabs.includes(tab);
    if (tabDefinedValid) {
      return resolve(null);
    } else if (fileId) {
      return resolve('file');
    } else {
      return this.findNonEmptyCollection();
    }
  })),

  fileProxyError: computed('fileProxy.reason', function fileProxyError() {
    const reason = this.get('fileProxy.reason');
    if (reason) {
      return this.get('errorExtractor').getMessage(reason);
    }
  }),

  tabObserver: observer('tab', function tabObserver() {
    const {
      tab,
      changeListTab,
    } = this.getProperties('tab', 'changeListTab');
    changeListTab(tab);
    this.set('tabJustChangedId', tab);
  }),

  async findNonEmptyCollection() {
    try {
      for (const collectionName of prioritisedBasicTabs) {
        const collectionTransfers = await this.transferManager.getTransfersForSpace(
          this.space,
          collectionName,
          null,
          1,
          0,
        );
        if (collectionTransfers.length) {
          return collectionName;
        }
      }
      return defaultTab;
    } catch (error) {
      console.error('Cannot fetch transfers due to error:', error);
      return defaultTab;
    }
  },

  init() {
    this._super(...arguments);
    const {
      initialTabProxy,
      changeListTab,
    } = this.getProperties('initialTabProxy', 'changeListTab');
    initialTabProxy.then((tab) => {
      if (tab) {
        changeListTab(tab);
      }
    });
  },

  actions: {
    clearJustChangedTabId(type) {
      if (this.get('tabJustChangedId') === type) {
        this.set('tabJustChangedId', null);
      }
    },
    openDbViewModal(dbViewName) {
      return this.setProperties({
        dbViewModalOpened: true,
        dbViewModalName: dbViewName,
      });
    },
    dbViewModalHidden() {
      this.set('dbViewModalName', null);
    },
    closeFileTab() {
      this.get('closeFileTab')();
    },
  },
});
