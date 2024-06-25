/**
 * Provides auto-updated state of QoS requirements fulfillment for multiple files.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { computed, observer } from '@ember/object';
import { mapBy } from '@ember/object/computed';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import QosFileItem from 'oneprovider-gui/utils/qos-file-item';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { all as allFulfilled } from 'rsvp';
import Looper from 'onedata-gui-common/utils/looper';
import { conditional, equal, raw } from 'ember-awesome-macros';

const mixins = [
  OwnerInjector,
];

export default EmberObject.extend(...mixins, {
  /**
   * @virtual
   * @type {Array<Models.Files>}
   */
  files: undefined,

  /**
   * Initialized on init
   * @type {Looper}
   */
  updater: null,

  fileItems: computed('files.[]', function fileItems() {
    const filesSorted = [...this.get('files')].sortBy('name');
    return filesSorted.map(file => {
      return QosFileItem.create({
        ownerSource: this,
        file,
      });
    });
  }),

  /**
   * @type {Array<QosStatus>}
   */
  filesStatus: mapBy('fileItems', 'fileQosStatus'),

  /**
   * One of: error, loading, pending, impossible, fulfilled, unknown
   * @type {ComputedProperty<String>}
   */
  allQosStatus: computed('filesStatus.[]', function allQosStatus() {
    const filesStatus = this.filesStatus;
    const statusPriorityOrder = [
      'error',
      'loading',
      'pending',
      'impossible',
      'fulfilled',
      'empty',
    ];
    for (const status of statusPriorityOrder) {
      if (filesStatus.includes(status)) {
        return status;
      }
    }
    return 'unknown';
  }),

  /**
   * If modal is opened - interval in ms to auto update data
   * @type {Number}
   */
  updateInterval: conditional(
    equal('allQosStatus', raw('pending')),
    raw(3000),
    raw(15000),
  ),

  configureUpdater: observer(
    'updater',
    'updateInterval',
    function configureUpdater() {
      this.set('updater.interval', this.updateInterval);
    }
  ),

  init() {
    this._super(...arguments);
    this.initUpdater();
  },

  /**
   * @override
   */
  willDestroy() {
    try {
      this.updater?.destroy();
    } finally {
      this._super(...arguments);
    }
  },

  initUpdater() {
    const updater = Looper.create({
      immediate: true,
    });
    updater.on('tick', () => {
      this.updateData(true);
    });
    this.set('updater', updater);
    this.configureUpdater();
  },

  async updateData(replace = false) {
    const fileItems = this.get('fileItems');
    try {
      await allFulfilled(fileItems.invoke('updateData', replace));
    } catch (error) {
      safeExec(this, 'set', 'updater.interval', null);
    }
  },
});
