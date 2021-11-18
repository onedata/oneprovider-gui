/**
 * Shows single workflow schema. It is an internal component of atm-workflow-schemas-list.
 *
 * @module components/space-automation/atm-workflow-schemas-list/list-entry
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: [
    'list-entry',
    'iconified-block',
  ],
  classNameBindings: ['matchesInputData::no-input-match'],

  /**
   * @override
   */
  i18nPrefix: 'components.spaceAutomation.atmWorkflowSchemasList.listEntry',

  /**
   * @virtual
   * @type {Models.AtmWorkflowSchema}
   */
  atmWorkflowSchema: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  matchesInputData: true,

  /**
   * @virtual
   * @type {(atmWorkflowSchema: Models.AtmWorkflowSchema, revisionNumber: number) => void}
   */
  onRevisionClick: undefined,

  actions: {
    revisionClick(revisionNumber) {
      const {
        atmWorkflowSchema,
        onRevisionClick,
      } = this.getProperties('atmWorkflowSchema', 'onRevisionClick');

      if (onRevisionClick) {
        onRevisionClick(atmWorkflowSchema, revisionNumber);
      }
    },
  },
});
