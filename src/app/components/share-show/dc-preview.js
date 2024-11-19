/**
 * Open Data viewer with visual (Dublin Core Metadata values render) and XML (raw text)
 * modes.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import { get, computed } from '@ember/object';
import { bool } from '@ember/object/computed';
import dublinCoreXmlParser from 'oneprovider-gui/utils/dublin-core-xml-parser';
import Dc from './-dc';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

export default Dc.extend({
  classNames: ['share-show-dc-preview'],

  /**
   * DC preview can be rendered both in authenticated or unauthenticated (public) mode.
   * Set to true if it is rendered in public mode to hide some features.
   * @virtual optional
   * @type {boolean}
   */
  isPublicView: false,

  /**
   * @virtual optional
   * @type {(isEditMode: boolean) => void}
   */
  onChangeEditMode: undefined,

  /**
   * @virtual optional Needed in private views.
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * For format reference see `util:dublin-core-xml-generator#groupedEntries`.
   * @override
   * @type {Array<{ type: String, value: String }>}
   */
  groupedEntries: computed('xmlValue', function groupedEntries() {
    return get(
      dublinCoreXmlParser.create({ xmlSource: this.get('xmlValue') }),
      'groupedEntries'
    );
  }),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasManageSharesPrivilege: bool('space.privileges.manageShares'),

  isModifyDisabled: bool('modifyDisabledTip'),

  modifyDisabledTip: computed(
    'hasManageSharesPrivilege',
    function modifyDisabledTip() {
      if (!this.hasManageSharesPrivilege) {
        return insufficientPrivilegesMessage({
          i18n: this.i18n,
          modelName: 'space',
          privilegeFlag: 'space_manage_shares',
        });
      }
    }
  ),

  actions: {
    startModify() {
      this.onChangeEditMode?.(true);
    },
  },
});
