/**
 * Implementation of change state (attach/detach) menu action for dataset.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseAction from './-base';
import {
  anySelectedContexts,
} from 'oneprovider-gui/components/file-browser';
import { reads } from '@ember/object/computed';
import { bool, equal, raw, conditional, or } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { inject as service } from '@ember/service';

export default BaseAction.extend({
  modalManager: service(),
  globalNotify: service(),
  datasetManager: service(),

  /**
   * @override
   */
  actionId: 'removeDataset',

  /**
   * @override
   */
  icon: conditional(
    'isAttachAction',
    raw('plug-in'),
    raw('plug-out'),
  ),

  /**
   * @override
   */
  showIn: Object.freeze([
    ...anySelectedContexts,
  ]),

  /**
   * @override
   */
  title: conditional(
    'isAttachAction',
    computedT('title.attach'),
    computedT('title.detach'),
  ),

  /**
   * @override
   */
  disabled: bool('disabledTip'),

  /**
   * @override
   */
  tip: reads('disabledTip'),

  disabledTip: conditional(
    'isAnySelectedRootDeleted',
    computedT('tip.cannotReattachDeleted'),
    null,
  ),

  /**
   * Specifies a mode of current view - showing attached or detached datasets.
   * It is assumed, that all dataset on single view is either attached or detached,
   * so checking only the first dataset.
   * @type {'attached'|'detached'}
   */
  attachmentState: or('selectedItems.0.state', raw('attached')),

  /**
   * If true, the button represents "attach" action - user will be asked to reattach
   * detached dataset. Otherwise the button represents "detach" dataset in attached state.
   * @type {ComputedProperty<boolean>}
   */
  isAttachAction: equal('attachmentState', raw('detached')),

  /**
   * @override
   */
  onExecute(selectedItems) {
    const isAttachAction = this.get('isAttachAction');
    return this.askForToggleAttachment(
      selectedItems,
      isAttachAction ? 'attached' : 'detached'
    );
  },
});
