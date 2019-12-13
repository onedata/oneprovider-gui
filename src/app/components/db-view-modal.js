/**
 * FIXME: description
 * 
 * @module components/db-view-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';
import { get, getProperties, computed } from '@ember/object';
import gri from 'onedata-gui-websocket-client/utils/gri';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { inject as service } from '@ember/service';
import { promise } from 'ember-awesome-macros';
import { notImplementedThrow } from 'onedata-gui-common/utils/not-implemented-throw';
import { all as allSettled } from 'rsvp';

export default Component.extend(I18n, {
  /**
   * @override
   */
  i18nPrefix: 'components.dbViewModal',

  store: service(),
  onedataGraph: service(),

  /**
   * @virtual
   */
  dbViewName: undefined,

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onHidden: notImplementedThrow,

  /**
   * @virtual
   * @type {Function}
   */
  close: notImplementedThrow,

  open: false,

  spaceName: reads('space.name'),

  dbView: reads('dbViewProxy.content'),

  dbViewProxy: promise.object(
    computed('space', 'dbViewName', function dbViewProxy() {
      const {
        space,
        dbViewName,
        onedataGraph,
      } = this.getProperties('space', 'dbViewName', 'onedataGraph');
      const {
        entityType,
        entityId,
      } = getProperties(space, 'entityType', 'entityId');
      const requestGri = gri({
        entityType,
        entityId,
        aspect: 'view',
        aspectId: dbViewName,
        scope: 'private',
      });
      return onedataGraph.request({
        operation: 'get',
        gri: requestGri,
        subscribe: false,
      });
    }),
  ),

  /**
   * @type {PromiseArray<>}
   */
  providerNamesProxy: promise.array(
    computed('dbViewProxy.content.providers', function providerNamesProxy() {
      const store = this.get('store');
      return this.get('dbViewProxy').then((dbView) => {
        const providers = get(dbView, 'providers');
        return allSettled(providers.map((providerId) => {
          const providerGri = gri({
            entityType: providerEntityType,
            entityId: providerId,
            aspect: 'instance',
            scope: 'protected',
          });
          return store.findRecord('provider', providerGri)
            .then(provider => get(provider, 'name'))
            .catch(() => providerId);
        }));
      });
    }),
  ),

  actions: {
    close() {
      return this.get('close')();
    },
    onHidden() {
      return this.get('onHidden')();
    },
  },
});
