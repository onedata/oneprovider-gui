/**
 * Adds dataset-browser-specific implementation for remove action.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import CurrentDirDisappearing from 'oneprovider-gui/mixins/dataset/actions/current-dir-disappearing';
import RemoveAction from './remove-action';

export default RemoveAction.extend(CurrentDirDisappearing);
