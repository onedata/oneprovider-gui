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
import { computed, get, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { promise, and, not } from 'ember-awesome-macros';
import FileArchiveInfo from 'oneprovider-gui/utils/file-archive-info';
import { promiseObject } from 'onedata-gui-common/utils/ember/promise-object';
import { resolve } from 'rsvp';
import { htmlSafe } from '@ember/string';
import { getArchiveRelativeFilePath } from 'oneprovider-gui/utils/file-archive-info';
import { stringifyFilePath, dirSeparator } from 'oneprovider-gui/utils/resolve-file-path';

export default Component.extend(I18n, {
  classNames: ['cell-data-name', 'cell-file-name'],

  i18n: service(),
  filesViewResolver: service(),
  isMobile: service(),
  datasetManager: service(),
  archiveManager: service(),

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
  space: reads('record.space'),

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  totalFiles: computed('record.{replicatedFiles,evictedFiles}', function () {
    const {
      replicatedFiles,
      evictedFiles,
    } = getProperties(this.get('record'), 'replicatedFiles', 'evictedFiles');
    return (replicatedFiles + evictedFiles) || 0;
  }),

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

  deletedIsDir: computed('totalFiles', function deletedIsDir() {
    const totalFiles = this.get('totalFiles');
    return Boolean(totalFiles) && totalFiles > 1;
  }),

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

  /**
   * @type {ComputedProperty<PromiseObject<string>>}
   */
  hintProxy: promise.object(computed(
    'dataSourceName',
    'dataSourceType',
    'deletedIsDir',
    async function hint() {
      const {
        datasetManager,
        archiveManager,
        dataSourceName,
        dataSourceType,
        deletedIsDir,
      } = this.getProperties(
        'datasetManager',
        'archiveManager',
        'dataSourceName',
        'dataSourceType',
        'deletedIsDir'
      );

      switch (dataSourceType) {
        case 'file':
        case 'dir': {
          const unknownHtml = `<em>${this.t('unknown')}</em>`;
          const fileNames = dataSourceName.split(dirSeparator).slice(1);
          const filePath = fileNames.map(fileName => ({
            name: fileName,
          }));
          const fileArchiveInfo = FileArchiveInfo.create({
            filePathProxy: promiseObject(resolve(filePath)),
          });
          const isInArchive = await get(fileArchiveInfo, 'isInArchiveProxy');
          if (isInArchive) {
            let datasetName;
            try {
              const datasetId = await get(fileArchiveInfo, 'datasetIdProxy');
              datasetName = `<code>${datasetId}</code>`;
              const dataset = await datasetManager.getBrowsableDataset(datasetId);
              if (dataset) {
                datasetName = get(dataset, 'name') || datasetName;
              }
            } catch (error) {
              if (!datasetName) {
                datasetName = unknownHtml;
              }
            }
            let archiveName;
            try {
              const archiveId = await get(fileArchiveInfo, 'archiveIdProxy');
              archiveName = `<code>${archiveId}</code>`;
              const archive = await archiveManager.getBrowsableArchive(archiveId);
              if (archive) {
                archiveName = get(archive, 'name') || archiveName;
              }
            } catch (error) {
              if (!archiveName) {
                archiveName = unknownHtml;
              }
            }
            const relativePathString =
              stringifyFilePath(getArchiveRelativeFilePath(filePath));
            return htmlSafe(`
              <div class="tip-row-dataset">
                <span class="tip-label">${this.t('dataset')}:</span>
                <span class="dataset-name">${datasetName}</span>
              </div>
              <div class="tip-row-archive">
                <span class="tip-label">${this.t('archive')}:</span>
                <span class="archive-name">${archiveName}</span>
              </div>
              <div class="tip-row-path">
                <span class="tip-label">${this.t(dataSourceType)}:</span>
                <span class="path">${relativePathString}</span>
              </div>
            `);
          } else {
            return htmlSafe(`
              <div class="tip-row-path">
                <span class="tip-label">${this.t(dataSourceType)}:</span>
                <span class="path">${dataSourceName}</span>
              </div>
            `);
          }
        }
        case 'deleted':
          return htmlSafe(`
            <div class="tip-row-path">
              <span class="tip-label">${this.t((deletedIsDir ? 'dir' : 'file'))}:</span>
              <span class="path">${dataSourceName}</span>
              <span class="tip-label">(${this.t('deleted')})</span>
            </div>
          `);
        case 'view':
          return htmlSafe(`
            <div class="tip-row-path">
              <span class="tip-label">${this.t(dataSourceType)}:</span>
              <span class="view-name">${dataSourceName}</span>
            </div>
          `);
        default:
          break;
      }
    }
  )),

  hint: reads('hintProxy.content'),

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
