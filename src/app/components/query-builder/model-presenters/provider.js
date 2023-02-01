/**
 * Representation of provider
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import GenericModelPresenter from './-generic';
import {
  defaultSeparator as defaultNameConflictSeparator,
} from 'onedata-gui-common/components/name-conflict';
import layout from '../../../templates/components/query-builder/model-presenters/provider';

export default GenericModelPresenter.extend({
  layout,

  nameConflictSeparator: ` ${defaultNameConflictSeparator}`,
});
