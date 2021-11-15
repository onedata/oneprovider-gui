/**
 * Cell with file name for transfer row.
 *
 * @module components/space-transfers/cell-data-name
 * @author Jakub Liput
 * @copyright (C) 2017 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import fileName from 'oneprovider-gui/utils/file-name';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { promise, not } from 'ember-awesome-macros';

export default Component.extend({
  classNames: ['cell-data-name', 'cell-file-name'],

  i18n: service(),
  filesViewResolver: service(),
  isMobile: service(),

  /**
   * @virtual
   * @type {Utils.TransferTableRecord}
   */
  record: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  openDbViewModal: notImplementedThrow,

  navigateTarget: '_top',

  /**
   * Same as in `Transfer.dataSourceType`.
   * One of: dir, file, deleted, view, unknown
   */
  dataSourceType: reads('record.transfer.dataSourceType'),
  dataSourceName: reads('record.transfer.dataSourceName'),
  dataSourceId: reads('record.transfer.dataSourceId'),
  space: reads('record.space'),

  name: computed(
    'dataSourceType',
    'dataSourceName',
    function name() {
      switch (this.get('dataSourceType')) {
        case 'file':
        case 'dir':
        case 'deleted':
          return fileName(this.get('dataSourceName'));
        case 'view':
          return this.get('dataSourceName');
        default:
          break;
      }
    }
  ),

  icon: computed('dataSourceType', function icon() {
    const dataSourceType = this.get('dataSourceType');
    switch (dataSourceType) {
      case 'view':
        return 'index';
      case 'file':
        return 'browser-file';
      case 'dir':
        return 'browser-directory';
      case 'deleted':
        return 'x';
      default:
        return 'unknown';
    }
  }),

  hrefProxy: promise.object(computed(
    'dataSourceType',
    'dataSourceId',
    async function hrefProxy() {
      const {
        filesViewResolver,
        dataSourceType,
        dataSourceId,
      } = this.getProperties('filesViewResolver', 'dataSourceType', 'dataSourceId');
      if (!dataSourceId || (dataSourceType !== 'file' && dataSourceType !== 'dir')) {
        return null;
      }
      try {
        return await filesViewResolver.generateUrlById(dataSourceId, 'select');
      } catch (error) {
        console.warn(
          'component:space-transfers/cell-data-name#hrefProxy: generating URL failed',
          error
        );
        return null;
      }
    }
  )),

  href: reads('hrefProxy.content'),

  enableMobileHint: reads('isMobile.any'),

  enableDesktopHint: not('isMobile.any'),

  actions: {
    openDbViewModal(mouseEvent) {
      const dbViewName = this.get('dataSourceName');
      try {
        this.get('openDbViewModal')(dbViewName);
      } finally {
        mouseEvent.stopPropagation();
      }
    },
    stopEventPropagation(event) {
      event.stopPropagation();
    },
  },
});
