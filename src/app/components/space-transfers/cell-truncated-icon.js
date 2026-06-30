/**
 * A cell component with destination text and type of transfer used by `space-transfers` component.
 *
 * @author Agnieszka Raczek
 * @copyright (C) 2026 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/i18n';

const allowedTypes = new Set(['replication', 'migration', 'eviction']);

export default Component.extend(I18n, {
  classNames: ['cell-type-destination'],
  classNameBindings: ['type'],
  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.cellType',

  /**
   * ember-models-table record
   * @virtual
   * @type {Object}
   */
  record: undefined,

  /**
   * Transfer type (replication/migration/eviction).
   * @type {Ember.ComputedProperty<string>}
   */
  type: computed.reads('record.type'),

  /**
   * Status icon.
   * @type {Ember.ComputedProperty<string>}
   */
  icon: computed('type', function icon() {
    switch (this.get('type')) {
      case 'migration':
        return 'data-send';
      case 'replication':
        return 'data-receive';
      case 'eviction':
        return 'x';
      default:
        return 'unknown';
    }
  }),

  /**
   * Status tooltip content.
   * @type {Ember.ComputedProperty<string>}
   */
  hint: computed('type', function hint() {
    const type = this.get('type');
    const translationKey = allowedTypes.has(type) ? type : 'unknown';
    return this.t(translationKey);
  }),
});
