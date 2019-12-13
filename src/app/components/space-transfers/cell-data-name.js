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
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';

export default Component.extend(I18n, {
  classNames: ['cell-data-name', 'cell-file-name'],
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.cellDataName',

  /**
   * @virtual
   * @type {Function}
   */
  openDbViewModal: notImplementedThrow,

  record: undefined,

  /**
   * Same as in `Transfer.dataSourceType`.
   * One of: dir, file, deleted, view, unknown
   */
  dataSourceType: computed.reads('record.dataSourceType'),
  dataSourceName: computed.reads('record.dataSourceName'),
  totalFiles: computed.reads('record.totalFiles'),
  dataSourceRecordProxy: computed.reads('record.dataSourceRecord'),
  dataSourceRecord: computed.reads('record.dataSourceRecord.content'),
  space: computed.reads('record.space'),

  name: computed(
    'dataSourceType',
    'dataSourceName',
    'viewName',
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

  deletedIsDir: computed('totalFiles', function deletedType() {
    return this.get('totalFiles') > 1;
  }),

  icon: computed('dataSourceType', 'deletedIsDir', function () {
    const {
      dataSourceType,
      // deletedIsDir,
    } = this.getProperties('dataSourceType', 'deletedIsDir');
    switch (dataSourceType) {
      case 'view':
        return 'index';
      case 'file':
        return 'browser-file';
      case 'dir':
        return 'browser-directory';
      case 'deleted':
        return 'x';
        // TODO: icons for deleted file and dir
        //   return deletedIsDir ? 'folder-deleted' : 'file-deleted';
      default:
        return 'unknown';
    }
  }),

  /**
   * @type {ComputedProperty<string>}
   */
  hint: computed('dataSourceName', 'viewName', 'dataSourceType', 'deletedIsDir',
    function hint() {
      const {
        dataSourceName,
        dataSourceType,
        deletedIsDir,
      } = this.getProperties(
        'dataSourceName',
        'dataSourceType',
        'deletedIsDir'
      );

      switch (dataSourceType) {
        case 'file':
          return `${this.t('file')}: ${dataSourceName}`;
        case 'dir':
          return `${this.t('dir')}: ${dataSourceName}`;
        case 'deleted':
          return `${this.t((deletedIsDir ? 'file' : 'dir'))}: ${dataSourceName}`;
        case 'view':
          return `${this.t('view')}: ${dataSourceName}`;
        default:
          break;
      }
    }),

  actions: {
    openDbViewModal(mouseEvent) {
      const dbViewName = this.get('dataSourceName');
      try {
        this.get('openDbViewModal')(dbViewName);
      } finally {
        mouseEvent.stopPropagation();
      }
    },
  },
});
