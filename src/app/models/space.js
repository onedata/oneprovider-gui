/**
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import StaticGraphModelMixin from 'onedata-gui-websocket-client/mixins/models/static-graph-model';
import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';
import allSpacePrivilegeFlags from 'onedata-gui-websocket-client/utils/space-privileges-flags';
import { inject as service } from '@ember/service';
import computedCurrentUserPrivileges from 'onedata-gui-common/utils/computed-current-user-privileges';

/**
 * An object where keys are camel case names of space privileges without `space_` prefix,
 * without group division (listed in `utils/space-privileges-flags`). Values are flags
 * indicating if currently authenticated user have the privilege (when `true`).
 * For Example: `{ view: true, read: false, viewTransfer: true, ... }`
 * @typedef {Object} SpacePrivileges
 */

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
    currentUserIsOwner: attr('boolean'),
    providersWithReadonlySupport: attr('array', { defaultValue: () => [] }),

    /**
     * @override
     */
    fetchTransfersActiveChannels() {
      return this.get('transferManager').getSpaceTransfersActiveChannels(this);
    },

    privileges: computedCurrentUserPrivileges({ allFlags: allSpacePrivilegeFlags }),
  }
).reopenClass(StaticGraphModelMixin);
