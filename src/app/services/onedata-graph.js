/**
 * Exports a real onedata-graph service or its mock.
 * @module services/onedata-graph
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import config from 'ember-get-config';
import { environmentExport } from 'onedata-gui-websocket-client/utils/development-environment';
import ProductionSymbol from 'onedata-gui-websocket-client/services/onedata-graph';
import DevelopmentSymbol from 'oneprovider-gui/services/mocks/onedata-graph';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import { get, getProperties } from '@ember/object';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { allSettled } from 'rsvp';

const OnedataGraphProduction = ProductionSymbol.extend({
  /**
   * @override
   */
  getRequestPrerequisitePromise(requestData) {
    const superPromise = this._super(...arguments);
    const createRequests = this.get('activeRequests.createRequests');

    const {
      operation,
      gri,
    } = getProperties(
      requestData,
      'operation',
      'gri'
    );
    const {
      entityType,
      entityId,
      aspect,
    } = getProperties(
      parseGri(gri),
      'entityType',
      'entityId',
      'aspect'
    );

    switch (operation) {
      case 'get': {
        if (entityType === fileEntityType && aspect && aspect.startsWith('children')) {
          const createChildRequests = createRequests.filter(request => {
            return get(request, 'modelClassName') === 'file' &&
              get(get(request, 'model').belongsTo('parent').value(), 'entityId') ===
              entityId;
          });
          return superPromise.then(() =>
            allSettled(createChildRequests.mapBy('promise'))
          );
        } else {
          return superPromise;
        }
      }
      default:
        return superPromise;
    }
  },
});

export default environmentExport(config, OnedataGraphProduction, DevelopmentSymbol);
