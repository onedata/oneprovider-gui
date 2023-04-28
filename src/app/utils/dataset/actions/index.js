/**
 * Export action classes for dataset.
 *
 * @author Jakub Liput
 * @copyright (C) 2022-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import CopyDatasetIdAction from 'oneprovider-gui/utils/dataset/actions/copy-dataset-id-action';
import CreateArchiveAction from 'oneprovider-gui/utils/dataset/actions/create-archive-action';
import ChangeStateAction from 'oneprovider-gui/utils/dataset/actions/change-state-action';
import BrowserChangeStateAction from 'oneprovider-gui/utils/dataset/actions/browser-change-state-action';
import RemoveAction from 'oneprovider-gui/utils/dataset/actions/remove-action';
import BrowserRemoveAction from 'oneprovider-gui/utils/dataset/actions/browser-remove-action';

export {
  CopyDatasetIdAction,
  CreateArchiveAction,
  ChangeStateAction,
  BrowserChangeStateAction,
  RemoveAction,
  BrowserRemoveAction,
};
