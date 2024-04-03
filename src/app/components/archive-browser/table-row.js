/**
 * Implementation of table-row for archive browser - represents a archive established
 * on file or directory.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRow from 'oneprovider-gui/components/file-browser/fb-table-row';
import EmberObject, { computed, get } from '@ember/object';
import { reads, equal } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/i18n';
import { promise, bool, or } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

const rowModelMixins = [
  OwnerInjector,
  I18n,
  createDataProxyMixin('baseArchive'),
];

// TODO: VFS-7643 move to other file
const RowModel = EmberObject.extend(...rowModelMixins, {
  i18n: service(),
  archiveManager: service(),
  userManager: service(),
  currentUser: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRow',

  /**
   * @virtual
   * @type {Components.DatasetBrowser.TableRow}
   */
  tableRow: undefined,

  /**
   * @virtual
   * @type {Utils.ArchiveBrowserModel}
   */
  browserModel: undefined,

  /**
   * @override
   */
  ownerSource: reads('tableRow'),

  archive: reads('tableRow.archive'),

  isIncremental: bool('archive.config.incremental.enabled'),

  includeDip: reads('archive.config.includeDip'),

  archiveLayout: reads('archive.config.layout'),

  creatorId: reads('archive.creatorId'),

  creatorProxy: promise.object(computed(
    'browserModel.spaceId',
    'creatorId',
    async function creatorProxy() {
      if (!this.creatorId) {
        return null;
      }
      return await this.userManager.getUserById(this.creatorId, {
        throughSpaceId: this.browserModel.spaceId,
      });
    }
  )),

  baseArchiveId: computed('archive.baseArchive', function baseArchiveId() {
    const archive = this.get('archive');
    if (archive) {
      return archive.relationEntityId('baseArchive');
    }
  }),

  datasetId: computed('archive.dataset', function datasetId() {
    const archive = this.get('archive');
    if (archive) {
      return archive.relationEntityId('dataset');
    }
  }),

  baseArchiveHrefProxy: promise.object(computed(
    'archive',
    'datasetId',
    'baseArchiveId',
    'browserModel.getDatasetsUrl',
    'baseArchiveProxy.content',
    async function baseArchiveHrefProxy() {
      const {
        archive,
        datasetId,
        baseArchiveId,
        browserModel,
      } = this.getProperties('archive', 'datasetId', 'baseArchiveId', 'browserModel');
      const getDatasetsUrl = get(browserModel, 'getDatasetsUrl');
      if (!getDatasetsUrl || !baseArchiveId || !datasetId || !archive) {
        return;
      }
      const archiveId = get(archive, 'entityId');
      let baseDatasetId;
      if (archiveId === baseArchiveId) {
        baseDatasetId = archive.relationEntityId('dataset');
      } else {
        const baseArchive = await this.get('baseArchiveProxy');
        baseDatasetId = baseArchive && baseArchive.relationEntityId('dataset') || null;
      }
      return getDatasetsUrl({
        selectedDatasets: [baseDatasetId],
        selectedArchives: [baseArchiveId],
      });
    }
  )),

  baseArchiveNameProxy: promise.object(computed(
    'baseArchiveProxy.content',
    async function baseArchiveNameProxy() {
      if (!this.get('baseArchiveId')) {
        return;
      }
      const baseArchive = await this.get('baseArchiveProxy');
      if (!baseArchive) {
        return;
      }
      return get(baseArchive, 'name');
    }
  )),

  /**
   * @type {ComputedProperty<boolean>}
   */
  isFailed: or(
    equal('archive.state', 'failed'),
    equal('archive.state', 'verification_failed'),
  ),

  /**
   * @override
   */
  async fetchBaseArchive() {
    const {
      archive,
      baseArchiveId,
      archiveManager,
    } = this.getProperties('archive', 'baseArchiveId', 'archiveManager');
    if (!this.get('baseArchiveId')) {
      return;
    }
    const baseArchive = await archive.getRelation('baseArchive', { reload: true });
    if (!baseArchive) {
      return null;
    }
    return archiveManager.getBrowsableArchive(baseArchiveId);
  },

  browseDip() {
    const {
      browserModel,
      archive,
    } = this.getProperties('browserModel', 'archive');
    return browserModel.browseArchiveDip(archive);
  },
});

export default FbTableRow.extend({
  classNames: ['archive-table-row'],

  /**
   * @override
   */
  icon: 'browser-archive',

  /**
   * @type {ComputedProperty<Archive>}
   */
  archive: reads('file'),

  // TODO: VFS-7643 this will be probably injected from above
  fileRowModel: computed(function fileRowModel() {
    return RowModel.create({
      tableRow: this,
      browserModel: this.get('browserModel'),
    });
  }),
});
