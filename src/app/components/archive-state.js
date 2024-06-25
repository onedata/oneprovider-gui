/**
 * Renders simple info about archive state including basic statistics.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';
import { htmlSafe } from '@ember/string';
import { raw, conditional } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import includes from 'onedata-gui-common/macros/includes';

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
    cancelled: '',
    failed: '',
    destroying: '',
  }),

  /**
   * @type {ComputedProperty<Array<ArchiveState>>}
   */
  hiddenDetailsStates: Object.freeze([
    'pending',
    'deleting',
  ]),

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

  isStateDetailsHidden: includes(
    'hiddenDetailsStates',
    'archive.state'
  ),

  stateTypeTextClass: computed(
    'stateClassMapping',
    'archive.metaState',
    function stateTypeTextClass() {
      return this.stateClassMapping[get(this.archive, 'metaState')];
    }
  ),

  stateDetailsTextClass: conditional(
    'isStateDetailsHidden',
    raw('hidden')
  ),
});
