/**
 * An abstraction layer for getting data for content of various tabs
 *
 * @module services/content-resources
 * @author Jakub Liput
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import { Promise, reject } from 'rsvp';

export default Service.extend({
  currentUser: service(),

  /**
   * @param {string} type plural type of tab, eg. providers
   * @param {string} id record ID
   * @returns {Promise}
   */
  getModelFor(type /*, id*/ ) {
    switch (type) {
      case 'data':
        return reject('TODO: no data resources');
      case 'shares':
        return reject('TODO: no shares resources');
      case 'transfers':
        return reject('TODO: no transfer resources');
      case 'users':
        return this.get('currentUser').getCurrentUserRecord();
      default:
        return Promise.reject('No such model type: ' + type);
    }
  },
});
