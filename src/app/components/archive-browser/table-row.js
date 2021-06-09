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
import EmberObject, { computed, getProperties } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import bytesToString from 'onedata-gui-common/utils/bytes-to-string';
import { htmlSafe } from '@ember/string';
import { conditional, equal, raw, or } from 'ember-awesome-macros';

const RowModel = EmberObject.extend(I18n, {
  /**
   * @virtual
   */
  i18n: undefined,

  /**
   * @virtual
   * @type {Components.DatasetBrowser.TableRow}
   */
  tableRow: undefined,

  i18nPrefix: 'components.archiveBrowser.tableRow',

  archive: reads('tableRow.archive'),

  showArchivedCounters: or(
    equal('archive.state', raw('building')),
    equal('archive.state', raw('preserved')),
  ),

  stateText: computed(
    'archive.{state,stats}',
    function stateText() {
      const {
        archive,
        showArchivedCounters,
      } = this.getProperties('archive', 'showArchivedCounters');
      const {
        state,
        stats,
      } = getProperties(archive, 'state', 'stats');
      const {
        bytesArchived,
        filesArchived,
      } = getProperties(stats, 'bytesArchived', 'filesArchived');
      const bytes = bytesArchived || 0;
      const filesText = filesArchived || '0';
      let text = this.t(`state.${state}`, {}, { defaultValue: this.t('state.unknown') });
      if (showArchivedCounters) {
        const sizeText = bytesToString(bytes);
        text += `<br>${this.t('stateInfo.archived', { filesCount: filesText, size: sizeText })}`;
      }
      return htmlSafe(text);
    }
  ),
  stateColClass: conditional(
    'showArchivedCounters',
    raw('multiline'),
    raw(''),
  ),
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
    const i18n = this.get('i18n');
    return RowModel.create({
      i18n,
      tableRow: this,
    });
  }),
});
