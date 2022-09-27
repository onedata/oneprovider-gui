/**
 * Cell that shows total processed files number.
 *
 * @module components/space-transfers/cell-affected-files
 * @author Michal Borzecki
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, getProperties } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: 'span',
  classNames: ['cell-affected-files'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.cellAffectedFiles',

  /**
   * @type {Ember.ComputedProperty<number>}
   */
  affectedFiles: computed('record.{replicatedFiles,evictedFiles}', function () {
    const {
      replicatedFiles,
      evictedFiles,
    } = getProperties(this.get('record'), 'replicatedFiles', 'evictedFiles');
    return (replicatedFiles + evictedFiles) || 0;
  }),

  /**
   * @type {Ember.ComputedProperty<string>}
   */
  tooltipTitle: computed('record.{replicatedFiles,evictedFiles}', function () {
    const {
      replicatedFiles,
      evictedFiles,
    } = getProperties(this.get('record'), 'replicatedFiles', 'evictedFiles');
    return `${replicatedFiles || 0} ${this.t('replicated')}, ` +
      `${evictedFiles || 0} ${this.t('evicted')}`;
  }),
});
