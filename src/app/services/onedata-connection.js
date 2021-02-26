/**
 * Exports a real onedata-connection service or its mock.
 * @module services/onedata-websocket
 * @author Jakub Liput
 * @copyright (C) 2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import config from 'ember-get-config';
import { environmentExport } from 'onedata-gui-websocket-client/utils/development-environment';
import ProductionSymbol from 'onedata-gui-websocket-client/services/onedata-connection';
import DevelopmentSymbol from 'oneprovider-gui/services/mocks/onedata-connection';
import { reads } from '@ember/object/computed';

export default environmentExport(config, ProductionSymbol, DevelopmentSymbol).extend({
  /**
   * @type {Ember.ComputedProperty<number>}
   */
  transfersHistoryLimitPerFile: reads('attributes.transfersHistoryLimitPerFile'),

  /**
   * Known templates:
   * - shareListDirChildren
   * - shareDownloadFileContent
   * @type {Ember.ComputedProperty<Object>}
   */
  restTemplates: reads('attributes.restTemplates'),
});
