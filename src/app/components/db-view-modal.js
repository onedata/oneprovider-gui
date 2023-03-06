/**
 * Modal for showing information and source of functions od Database View (aka Index)
 *
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { promise } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { all as allFulfilled } from 'rsvp';

export default Component.extend(I18n, {
  spaceManager: service(),
  providerManager: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.dbViewModal',

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
  onHidden: notImplementedIgnore,

  /**
   * @virtual
   * @type {Function}
   */
  close: notImplementedThrow,

  /**
   * @virtual
   * @type {boolean}
   */
  open: false,

  spaceName: reads('space.name'),

  dbView: reads('dbViewProxy.content'),

  dbViewProxy: promise.object(
    computed('space', 'dbViewName', function dbViewProxy() {
      const {
        space,
        dbViewName,
        spaceManager,
      } = this.getProperties('space', 'dbViewName', 'spaceManager');
      return spaceManager.getDbView(space, dbViewName);
    }),
  ),

  /**
   * @type {PromiseArray<String>}
   */
  providerNamesProxy: promise.array(
    computed('dbViewProxy.content.providers', function providerNamesProxy() {
      const {
        providerManager,
        dbViewProxy,
      } = this.getProperties('providerManager', 'dbViewProxy');
      return dbViewProxy.then((dbView) => {
        const providers = get(dbView, 'providers');
        return allFulfilled(providers.map((providerId) => {
          return providerManager.getProviderById(providerId)
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
