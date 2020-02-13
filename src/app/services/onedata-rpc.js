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

export default environmentExport(config, ProductionSymbol, DevelopmentSymbol);
