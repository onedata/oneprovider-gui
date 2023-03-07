/**
 * Exports a real dataset-manager service or its mock.
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import config from 'ember-get-config';
import { environmentExport } from 'onedata-gui-websocket-client/utils/development-environment';
import ProductionSymbol from 'oneprovider-gui/services/production/file-manager';
import DevelopmentSymbol from 'oneprovider-gui/services/mocks/file-manager';

export default environmentExport(config, ProductionSymbol, DevelopmentSymbol);
