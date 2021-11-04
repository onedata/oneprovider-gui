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
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { promise, and, not } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: ['cell-data-name', 'cell-file-name'],

  i18n: service(),
  filesViewResolver: service(),
  isMobile: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.cellDataName',

  /**
   * @virtual
   * @type {Function}
   */
  openDbViewModal: notImplementedThrow,

  navigateTarget: '_top',

  record: undefined,

  /**
   * Same as in `Transfer.dataSourceType`.
   * One of: dir, file, deleted, view, unknown
   */
  dataSourceType: reads('record.transfer.dataSourceType'),
  dataSourceName: reads('record.transfer.dataSourceName'),
  dataSourceId: reads('record.transfer.dataSourceId'),
  totalFiles: reads('record.totalFiles'),
  space: reads('record.space'),

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
          return `${this.t((deletedIsDir ? 'file' : 'dir'))}: ${dataSourceName} (${this.t('deleted')})`;
        case 'view':
          return `${this.t('view')}: ${dataSourceName}`;
        default:
          break;
      }
    }
  ),

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

  enableMobileHint: and('hint', 'isMobile.any'),

  enableDesktopHint: and('hint', not('isMobile.any')),

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
