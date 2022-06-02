/**
 * Renders simple info about archive state including basic statistics.
 *
 * @module components/archive-state
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { htmlSafe } from '@ember/string';
import { getBy, array, raw, conditional } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  classNames: ['archive-state'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.archiveBrowser.tableRow',

  /**
   * @virtual
   * @type {Models.Archive}
   */
  archive: undefined,

  /**
   * @type {Object<ArchiveMetaState, string>}
   */
  stateClassMapping: Object.freeze({
    creating: '',
    succeeded: '',
    failed: '',
    destroying: '',
  }),

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

  /**
   * @type {ComputedProperty<Array<ArchiveState>>}
   */
  hiddenDetailsStates: raw([
    'pending',
    'deleting',
  ]),

  isStateDetailsHidden: array.includes(
    'hiddenDetailsStates',
    'archive.state'
  ),

  stateTypeTextClass: getBy('stateClassMapping', 'archive.metaState'),

  stateDetailsTextClass: conditional(
    'isStateDetailsHidden',
    raw('hidden')
  ),
});
