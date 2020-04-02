/**
 * Virtual QoS entry for creating new QoS record
 * 
 * @module components/qos-modal/qos-add
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { not, or, notEmpty, gt, conditional, isEmpty, and } from 'ember-awesome-macros';
import { guidFor } from '@ember/object/internals';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosAdd',

  /**
   * @virutal
   * @type {Component}
   */
  collapsibleList: undefined,

  /**
   * @virtual
   * @type {boolean}
   */
  fileFulfilled: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  closeAddEntry: notImplementedIgnore,

  replicasNumber: 1,

  expressionInfix: '',

  expressionWasFocused: false,

  /**
   * @type {ComputedProperty<String>}
   */
  replicasNumberValidationMessage: conditional(
    gt('replicasNumber', 0),
    null,
    computedT('validation.replicasNumberTooSmall'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  expressionValidationMessage: conditional(
    or(not('expressionWasFocused'), notEmpty('expressionInfix')),
    null,
    computedT('validation.expressionEmpty'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  replicasNumberValid: isEmpty('replicasNumberValidationMessage'),

  expressionValid: and('expressionWasFocused', isEmpty('expressionValidationMessage')),

  saveDisabled: or(not('replicasNumberValid'), not('expressionValid')),

  componentId: computed(function componentId() {
    return guidFor(this);
  }),

  closeForm() {
    this.get('closeAddEntry')();
    safeExec(this, 'setProperties', {
      replicasNumber: 1,
      expressionInfix: '',
    });
  },

  actions: {
    save() {
      const {
        replicasNumber,
        expressionInfix,
        addEntry,
      } = this.getProperties('replicasNumber', 'expressionInfix', 'addEntry');
      return addEntry({
        replicasNumber,
        expressionInfix,
      }).then(() => {
        this.closeForm();
      });
    },
    disableEnterKey(keyEvent) {
      if (keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
      }
    },
    expressionInfixChanged(value) {
      this.set('expressionInfix', value);
    },
  },
});
