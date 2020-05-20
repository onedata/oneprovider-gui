/**
 * Form for creating new QoS record
 * 
 * @module components/qos-modal/qos-add
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { not, or, notEmpty, conditional, isEmpty, and, number } from 'ember-awesome-macros';
import { guidFor } from '@ember/object/internals';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import computedT from 'onedata-gui-common/utils/computed-t';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosAdd',

  /**
   * @virtual
   * @type {Function}
   */
  update: notImplementedThrow,

  replicasNumberString: '1',

  replicasNumber: number('replicasNumberString'),

  expressionInfix: '',

  expressionEditStarted: false,

  /**
   * @type {ComputedProperty<String>}
   */
  replicasNumberValidationMessage: conditional(
    computed('replicasNumber', function isPositiveInteger() {
      const replicasNumber = this.get('replicasNumber');
      return replicasNumber > 0 && Math.floor(replicasNumber) === replicasNumber;
    }),
    null,
    computedT('validation.replicasNumberTooSmall'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  expressionValidationMessage: conditional(
    or(not('expressionEditStarted'), notEmpty('expressionInfix')),
    null,
    computedT('validation.expressionEmpty'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  replicasNumberValid: isEmpty('replicasNumberValidationMessage'),

  expressionValid: and('expressionEditStarted', isEmpty('expressionValidationMessage')),

  isValid: and('replicasNumberValid', 'expressionValid'),

  componentId: computed(function componentId() {
    return guidFor(this);
  }),

  closeForm() {
    this.get('closeAddEntry')();
    this.resetForm();
  },

  resetForm() {
    safeExec(this, 'setProperties', {
      replicasNumberEdit: '1',
      expressionInfix: '',
      expressionEditStarted: false,
    });
  },

  notifyUpdate() {
    const {
      replicasNumber,
      expressionInfix,
      isValid,
      update,
    } = this.getProperties('replicasNumber', 'expressionInfix', 'isValid', 'update');
    return update({
        replicasNumber,
        expressionInfix,
      },
      isValid
    );
  },

  actions: {
    replicasNumberChanged(value) {
      this.set('replicasNumberString', value);
      this.notifyUpdate();
    },
    expressionInfixChanged(value) {
      if (!this.get('expressionEditStarted')) {
        this.set('expressionEditStarted', true);
      }
      this.set('expressionInfix', value);
      this.notifyUpdate();
    },
  },
});
