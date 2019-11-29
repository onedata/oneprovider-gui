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

const i18nPrefix = 'components.spaceTransfers.cellFileName.';

export default Component.extend(I18n, {
  classNames: ['cell-data-name', 'cell-file-name'],
  i18n: service(),

  /**
   * @virtual
   */
  i18nPrefix: 'components.spaceTransfers.cellActions',

  record: undefined,

  /**
   * Same as in `Transfer.dataSourceType`.
   * One of: dir, file, deleted, view, unknown
   */
  dataSourceType: computed.reads('record.dataSourceType'),
  filePath: computed.reads('record.path'),
  viewName: computed.reads('record.viewName'),
  totalFiles: computed.reads('record.totalFiles'),
  dataSourceRecordProxy: computed.reads('record.dataSourceRecord'),
  dataSourceRecord: computed.reads('record.dataSourceRecord.content'),
  space: computed.reads('record.space'),

  name: computed(
    'dataSourceType',
    'dataSourceName',
    'viewName',
    'filePath',
    function name() {
      switch (this.get('dataSourceType')) {
        case 'file':
        case 'dir':
        case 'deleted':
          return fileName(this.get('record.dataSourceName'));
        case 'view':
          return this.get('record.dataSourceName');
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
  hint: computed('filePath', 'viewName', 'dataSourceType', 'deletedIsDir',
    function hint() {
      const {
        i18n,
        filePath,
        viewName,
        dataSourceType,
        deletedIsDir,
      } = this.getProperties('i18n', 'filePath', 'viewName', 'dataSourceType',
        'deletedIsDir');

      switch (dataSourceType) {
        case 'file':
          return `${i18n.t(i18nPrefix + 'file')}: ${filePath}`;
        case 'dir':
          return `${i18n.t(i18nPrefix + 'dir')}: ${filePath}`;
        case 'deleted':
          return `${i18n.t(i18nPrefix + (deletedIsDir ? 'file' : 'dir'))}: ${filePath}`;
        case 'view':
          return `${i18n.t(i18nPrefix + 'view')}: ${viewName}`;
        default:
          break;
      }
    }),

  actions: {
    openViewModal(mouseEvent) {
      const dbViewId = this.get('record.dataSourceIdentifier');
      this.get('commonModals').openModal('dbView', {
        dbViewId,
      });
      mouseEvent.preventDefault();
      mouseEvent.stopImmediatePropagation();
    },
  },
});
