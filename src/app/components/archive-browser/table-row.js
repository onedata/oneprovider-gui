/**
 * Implementation of table-row for archive browser - represents a archive established
 * on file or directory.
 *
 * @module components/archive-browser/table-row
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import FbTableRow from 'oneprovider-gui/components/file-browser/fb-table-row';
import EmberObject, { computed, getProperties, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import { htmlSafe } from '@ember/string';
import { conditional, equal, raw, or, promise, bool, getBy } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import OwnerInjector from 'onedata-gui-common/mixins/owner-injector';

// TODO: VFS-7643 move to other file
const RowModel = EmberObject.extend(OwnerInjector, I18n, {
  i18n: service(),
  archiveManager: service(),

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
   * @type {Object<ArchiveMetaState, string>}
   */
  stateClassMapping: Object.freeze({
    creating: 'infinite animated pulse-mint',
    succeeded: '',
    failed: 'text-danger',
    destroying: 'infinite animated pulse-orange',
  }),

  /**
   * @override
   */
  ownerSource: reads('tableRow'),

  archive: reads('tableRow.archive'),

  isIncremental: bool('archive.config.incremental.enabled'),

  includeDip: reads('archive.config.includeDip'),

  archiveLayout: reads('archive.config.layout'),

  baseArchiveProxy: promise.object(computed(
    'archive.baseArchive',
    async function baseArchiveProxy() {
      const {
        baseArchiveId,
        archiveManager,
      } = this.getProperties('baseArchiveId', 'archiveManager');
      if (!this.get('baseArchiveId')) {
        return;
      }
      const baseArchive = await this.get('archive.baseArchive');
      if (!baseArchive) {
        return;
      }
      return archiveManager.getBrowsableArchive(baseArchiveId);
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
        baseDatasetId = baseArchive.relationEntityId('dataset');
      }
      return getDatasetsUrl({
        selectedDatasets: [baseDatasetId],
        selectedArchives: [baseArchiveId],
      });
    }
  )),

  baseArchiveNameProxy: promise.object(computed(
    'baseArchiveProxy',
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

  // FIXME: refactor names to match details and vice verss
  showArchivedCounters: or(
    equal('archive.state', raw('building')),
    equal('archive.state', raw('preserved')),
  ),

  stateTypeText: computed(
    'archive.state',
    function stateTypeText() {
      const archiveState = this.get('archive.state');
      const text = this.t(
        `state.${archiveState}`, {}, { defaultValue: this.t('state.unknown') }
      );
      return htmlSafe(text);
    }
  ),

  stateDetailsText: computed(
    'archive.stats',
    function stateDetailsText() {
      const {
        archive,
        showArchivedCounters,
      } = this.getProperties('archive', 'showArchivedCounters');
      if (showArchivedCounters) {
        const stats = get(archive, 'stats');
        const {
          bytesArchived,
          filesArchived,
        } = getProperties(stats, 'bytesArchived', 'filesArchived');
        const bytes = bytesArchived || 0;
        const filesText = filesArchived || '0';
        const sizeText = bytesToString(bytes);
        const text = this.t(
          'stateInfo.archived', {
            filesCount: filesText,
            size: sizeText,
          }
        );
        return htmlSafe(text);
      } else {
        return null;
      }
    }
  ),

  stateColClass: conditional(
    'showArchivedCounters',
    raw('multiline'),
    raw(''),
  ),

  stateTypeTextClass: getBy('stateClassMapping', 'archive.metaState'),

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
