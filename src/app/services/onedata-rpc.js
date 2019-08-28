/**
 * Exports a real onedata-rpc service or its mock.
 * @module services/onedata-rpc
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import config from 'ember-get-config';
import { environmentExport } from 'onedata-gui-websocket-client/utils/development-environment';
import ProductionSymbol from 'onedata-gui-websocket-client/services/onedata-rpc';
import DevelopmentSymbol from 'oneprovider-gui/services/mocks/onedata-rpc';
import { get } from '@ember/object';
import { allSettled } from 'rsvp';

const ExtendedProductionSymbol = ProductionSymbol.extend({
  /**
   * @override
   */
  getRequestPrerequisitePromise(methodName, args = {}) {
    const superPromise = this._super(...arguments);

    const createRequests = this.get('activeRequests.createRequests');
    
    switch (methodName) {
      case 'getDirChildren': {
        // Block on create child request
        const createChildRequests = createRequests.filter(request => {
          return get(request, 'modelClassName') === 'file' &&
            get(get(request, 'model').belongsTo('parent').value(), 'entityId') === args.guid;
        });
        return superPromise.then(() =>
          allSettled(createChildRequests.mapBy('promise'))
        );
      }
      default:
        return superPromise;
    }
  },
});

export default environmentExport(config, ExtendedProductionSymbol, DevelopmentSymbol);
