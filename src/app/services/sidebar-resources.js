/**
 * An abstraction layer for getting data for sidebar of various tabs
 *
 * @module services/sidebar-resources
 * @author Jakub Liput, Michal Borzecki
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { A } from '@ember/array';
import { Promise, reject } from 'rsvp';
import SidebarResources from 'onedata-gui-common/services/sidebar-resources';
import { inject as service } from '@ember/service';

export default SidebarResources.extend({
  currentUser: service(),

  /**
   * @param {string} type
   * @returns {PromiseArray}
   */
  getCollectionFor(type) {
    switch (type) {
      case 'data':
        return reject('TODO: no data resources');
      case 'shares':
        return reject('TODO: no shares resources');
      case 'transfers':
        return reject('TODO: no transfer resources');
      case 'users':
        return this.get('currentUser').getCurrentUserRecord().then(user => {
          return Promise.resolve({ list: A([user]) });
        });
      default:
        return reject('No such collection: ' + type);
    }
  },

  /**
   * Returns sidebar buttons definitions
   * @param {string} type
   * @returns {Array<object>}
   */
  getButtonsFor( /* type */ ) {
    return [];
  },
});
