/**
 * Adds dataset-browser-specific implementation for change-state action.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import CurrentDirDisappearing from 'oneprovider-gui/mixins/dataset/actions/current-dir-disappearing';
import ChangeStateAction from './change-state-action';

export default ChangeStateAction.extend(CurrentDirDisappearing);
