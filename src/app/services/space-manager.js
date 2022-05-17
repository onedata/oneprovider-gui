/**
 * Provides model functions related to spaces.
 *
 * @module services/space-manager
 * @author Jakub Liput
 * @copyright (C) 2019-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import config from 'ember-get-config';
import { environmentExport } from 'onedata-gui-websocket-client/utils/development-environment';
import ProductionSymbol from 'oneprovider-gui/services/production/space-manager';
import DevelopmentSymbol from 'oneprovider-gui/services/mocks/space-manager';

export default environmentExport(config, ProductionSymbol, DevelopmentSymbol);
