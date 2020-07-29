/**
 * @module models/space
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { camelize } from '@ember/string';

export const entityType = 'op_space';

export default Model.extend(
  GraphSingleModelMixin, {
    transferManager: service(),

    name: attr('string'),
    preferableWriteBlockSize: attr('number'),
    rootDir: belongsTo('file'),
    providerList: belongsTo('provider-list'),
    effUserList: belongsTo('user-list'),
    effGroupList: belongsTo('group-list'),
    shareList: belongsTo('share-list'),
    currentUserEffPrivileges: attr('array', { defaultValue: () => [] }),
    providersWithReadonlySupport: attr('array', { defaultValue: () => [] }),

    /**
     * @override
     */
    fetchTransfersActiveChannels() {
      return this.get('transferManager').getSpaceTransfersActiveChannels(this);
    },

    /**
     * Create convenient object with effective privileges flags.
     * Values are either true or there is no privilege key at all.
     * Flags are in camelCase without `space_` prefix as defined in
     * `onedata-gui-websocket-client/addon/utils/space-privileges-flags.js`.
     * Example property of this object is `viewQos` for `space_view_qos` privilege.
     * @type {ComputedProperty<Object>}
     */
    privileges: computed('currentUserEffPrivileges.[]', function privileges() {
      const currentUserEffPrivileges = this.get('currentUserEffPrivileges');
      return currentUserEffPrivileges.reduce((obj, privilege) => {
        const shortName = privilege.split('space_')[1];
        if (shortName) {
          obj[camelize(shortName)] = true;
        }
        return obj;
      }, {});
    }),
  }
).reopenClass(StaticGraphModelMixin);
