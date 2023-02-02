/**
 * Implementation of create archive menu action for dataset.
 * Does not include create modal implementation - needs injected open modal function.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseAction from './-base';
import { actionContext } from 'oneprovider-gui/components/file-browser';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { bool, equal, raw } from 'ember-awesome-macros';

export default BaseAction.extend({
  /**
   * @virtual
   * @type {Function}
   */
  onOpenCreateArchive: notImplementedThrow,

  /**
   * @virtual
   * @type {SpacePrivileges}
   */
  spacePrivileges: undefined,

  /**
   * @override
   */
  actionId: 'createArchive',

  /**
   * @override
   */
  icon: 'browser-archive-add',

  /**
   * @override
   */
  showIn: Object.freeze([
    actionContext.singleDir,
    actionContext.singleFile,
    actionContext.currentDir,
  ]),

  /**
   * @override
   */
  disabled: bool('disabledTip'),

  /**
   * @override
   */
  tip: reads('disabledTip'),

  isDetached: equal('selectedItems.0.state', raw('detached')),

  /**
   * @type {ComputedProperty<SafeString>}
   */
  disabledTip: computed(
    'spacePrivileges.createArchives',
    function disabled() {
      const {
        spacePrivileges,
        isDetached,
        i18n,
      } = this.getProperties(
        'spacePrivileges',
        'isDetached',
        'i18n',
      );
      if (isDetached) {
        return this.t('tip.notAvailableForDetached');
      }
      const hasPrivileges = spacePrivileges.createArchives;
      if (!hasPrivileges) {
        return insufficientPrivilegesMessage({
          i18n,
          modelName: 'space',
          privilegeFlag: ['space_create_archives'],
        });
      }
    }
  ),

  /**
   * @override
   */
  onExecute(selectedItems) {
    const dataset = selectedItems[0];
    this.get('onOpenCreateArchive')(dataset);
  },
});
