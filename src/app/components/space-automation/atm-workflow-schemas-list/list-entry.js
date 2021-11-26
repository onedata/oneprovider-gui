/**
 * Shows single workflow schema. It is an internal component of atm-workflow-schemas-list.
 *
 * @module components/space-automation/atm-workflow-schemas-list/list-entry
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { or, raw } from 'ember-awesome-macros';

export default Component.extend(I18n, {
  classNames: [
    'list-entry',
    'iconified-block',
  ],
  classNameBindings: ['hasMatchingRevisions::no-input-match'],

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
   * @type {number[]}
   */
  revisionNumbersMatchingInput: undefined,

  /**
   * @virtual
   * @type {(atmWorkflowSchema: Models.AtmWorkflowSchema, revisionNumber: number) => void}
   */
  onRevisionClick: undefined,

  /**
   * @type {ComputedProperty<Object>}
   */
  revisionRegistry: or('atmWorkflowSchema.revisionRegistry', raw({})),

  /**
   * Revision registry with revisions described by `revisionNumbersMatchingInput`
   * @type {ComputedProperty<Object>}
   */
  matchingRevisionRegistry: computed(
    'revisionRegistry',
    'revisionNumbersMatchingInput',
    function matchingRevisionRegistry() {
      const {
        revisionRegistry,
        revisionNumbersMatchingInput,
      } = this.getProperties('revisionRegistry', 'revisionNumbersMatchingInput');
      return revisionNumbersMatchingInput.reduce((acc, revisionNumber) => {
        acc[revisionNumber] = revisionRegistry[revisionNumber];
        return acc;
      }, {});
    }
  ),

  /**
   * @type {ComputedProperty<boolean>}
   */
  hasMatchingRevisions: computed(
    'matchingRevisionRegistry',
    function hasMatchingRevisions() {
      return Object.keys(this.get('matchingRevisionRegistry')).length > 0;
    }
  ),

  /**
   * @type {ComputedProperty<number>}
   */
  hiddenRevisionsCount: computed(
    'revisionRegistry',
    'matchingRevisionRegistry',
    function hiddenRevisionsCount() {
      const {
        revisionRegistry,
        matchingRevisionRegistry,
      } = this.getProperties('revisionRegistry', 'matchingRevisionRegistry');

      return Object.keys(revisionRegistry).length -
        Object.keys(matchingRevisionRegistry).length;
    }
  ),

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
