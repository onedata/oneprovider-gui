/**
 * Some parts of GUI needs to know if there was request for file started but not resolved
 * yet, so the file adapter tracks find requests to provide wait method.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import TrackedFind from 'onedata-gui-websocket-client/mixins/adapters/tracked-find';
import Application from './application';

export default Application.extend(TrackedFind);
