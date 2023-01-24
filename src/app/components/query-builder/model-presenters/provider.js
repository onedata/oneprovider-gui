/**
 * Representation of provider
 *
 * @module components/query-builder/model-presenters/provider
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { computed } from '@ember/object';
import GenericModelPresenter from './-generic';
import {
  defaultSeparator as defaultNameConflictSeparator,
} from 'onedata-gui-common/components/name-conflict';
import layout from '../../../templates/components/query-builder/model-presenters/provider';

export default GenericModelPresenter.extend({
  layout,

  nameConflictSeparator: computed(function nameConflictSeparator() {
    return ` ${defaultNameConflictSeparator}`;
  }),
});
