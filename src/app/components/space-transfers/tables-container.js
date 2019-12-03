/**
 * FIXME: doc
 * 
 * @module components/space-transfers/tables-container
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { resolve } from 'rsvp';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { promise } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import I18n from 'onedata-gui-common/mixins/components/i18n';

const basicTabs = Object.freeze(['waiting', 'ongoing', 'ended']);

export default Component.extend(I18n, {
  classNames: ['tables-container'],

  i18n: service(),
  store: service(),
  onedataConnection: service(),
  transferManager: service(),

  i18nPrefix: 'components.spaceTransfers',

  /**
   * @virtual
   */
  fileId: undefined,

  /**
   * @virtual optional
   * If set, skip auto select of first opened tab and use injected tab ID
   * @type {string|null}
   */
  defaultTab: undefined,

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

  tabIds: computed('fileId', function tabIds() {
    return this.get('fileId') ? [].concat('file', basicTabs) : basicTabs;
  }),

  /**
   * @type {ListWatcher}
   * Initialized in `didInsertElement`
   */
  listWatcher: undefined,

  rowHeight: 73,

  listLocked: false,

  /**
   * Holds tab ID that was opened recently.
   * It should be cleared if some operations after opening has been done.
   * @type {string|null}
   */
  tabJustChangedId: null,

  _window: window,

  /**
   * @type {ComputedProperty<models.File>}
   */
  file: reads('fileProxy.content'),

  activeTabId: reads('initialTabProxy.content'),

  /**
   * Max number of ended transfers that can be fetched for transfer
   * @type {ComputedProperty<number>}
   */
  historyLimitPerFile: reads('onedataConnection.transfersHistoryLimitPerFile'),

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
   * Number of loaded ended transfers for file tab.
   * @type {ComputedProperty<number>}
   */
  fileEndedTransfersCount: computed(
    'fileTransfers.sourceArray.@each.finishTime',
    function fileEndedTransfersCount() {
      const allFileTransfers = this.get('fileTransfers.sourceArray');
      if (allFileTransfers) {
        return allFileTransfers
          .reduce(
            (sum, transfer) => sum + (get(transfer, 'finishTime') ? 1 : 0),
            0
          );
      }
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
        store,
        fileId,
      } = this.getProperties('store', 'fileId');
      if (fileId) {
        const fileGri = gri({
          entityType: fileEntityType,
          entityId: fileId,
          aspect: 'instance',
          scope: 'private',
        });
        return store.findRecord('file', fileGri)
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
      defaultTab,
      fileId,
    } = this.getProperties('defaultTab', 'fileId');
    const defaultTabDefinedValid = defaultTab && (defaultTab === 'file' &&
      fileId) || ['waiting', 'ongoing', 'ended'].includes(defaultTab);
    if (defaultTabDefinedValid) {
      return resolve(defaultTab);
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

  /**
   * True if the `fileEndedTransfersCount` reached history limit
   * @type {boolean}
   */
  fileHistoryLimitReached: computed(
    'historyLimitPerFile',
    'fileEndedTransfersCount',
    function fileHistoryLimitReached() {
      const {
        historyLimitPerFile,
        fileEndedTransfersCount,
      } = this.getProperties('historyLimitPerFile', 'fileEndedTransfersCount');
      return fileEndedTransfersCount >= historyLimitPerFile;
    }
  ),

  activeTabIdObserver: observer('activeTabId', function activeTabIdObserver() {
    const {
      activeTabId,
      changeListTab,
    } = this.getProperties('activeTabId', 'changeListTab');
    changeListTab(activeTabId);
    this.set('tabJustChangedId', activeTabId);
  }),

  init() {
    this._super(...arguments);
  },

  findNonEmptyCollection() {
    const {
      transferManager,
      space,
    } = this.getProperties('transferManager', 'space');
    return transferManager.getTransfersForSpace(space, 'waiting', null, 1, 0)
      .then(result => {
        console.log(result);
        if (get(result, 'length') > 0) {
          return 'waiting';
        } else {
          return transferManager.getTransfersForSpace(space, 'ongoing', null, 1, 0);
        }
      })
      .then(result => {
        console.log(result);
        if (typeof result === 'string') {
          return result;
        } else if (get(result, 'length') > 0) {
          return 'ongoing';
        } else {
          return transferManager.getTransfersForSpace(space, 'ended', null, 1, 0);
        }
      })
      .then(result => {
        console.log(result);
        if (typeof result === 'string') {
          return result;
        } else if (get(result, 'length') > 0) {
          return 'ended';
        } else {
          return 'waiting';
        }
      });
  },

  actions: {
    clearJustChangedTabId(type) {
      if (this.get('tabJustChangedId') === type) {
        this.set('tabJustChangedId', null);
      }
    },
  },
});
