/**
 * Form for creating new QoS record
 *
 * @module components/qos-modal/qos-add
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import { computed, set, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { not, or, notEmpty, conditional, isEmpty, and, number, promise } from 'ember-awesome-macros';
import { guidFor } from '@ember/object/internals';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import computedT from 'onedata-gui-common/utils/computed-t';
import { inject as service } from '@ember/service';
import queryBlockToQosExpression from 'oneprovider-gui/utils/query-block-to-qos-expression';
import RootOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/root-operator-query-block';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import qosRpnToQueryBlock from 'oneprovider-gui/utils/qos-rpn-to-query-block';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.qosModal.qosAdd',

  /**
   * @virtual
   * @type {Function}
   */
  update: notImplementedThrow,

  /**
   * @virtual
   * @type {String}
   */
  spaceId: undefined,

  /**
   * @virtual
   * @type {Utils.QueryComponentValueBuilder}
   */
  valuesBuilder: undefined,

  /**
   * @type {ComputedProperty<PromiseObject<Object>>}
   * @virtual
   */
  queryPropertiesProxy: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  evaluateQosExpression: notImplementedReject,

  /**
   * @virtual
   * @type {Function}
   */
  refreshQueryProperties: notImplementedReject,

  replicasNumberString: '1',

  expressionInfix: '',

  expressionEditStarted: false,

  /**
   * Input expression in text mode
   * @type {String}
   */
  inputText: '',

  /**
   * One of:
   * - visual (add or edit query blocks in visual way)
   * - text (input query in text form and allow to transform it to visual)
   * @type {String}
   */
  inputMode: 'visual',

  /**
   * @type {Boolean}
   */
  queryBuilderValid: true,

  /**
   * @type {ComputedProperty<Array<QueryProperty>>}
   */
  queryProperties: reads('queryPropertiesProxy.content'),

  replicasNumber: number('replicasNumberString'),

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

  /**
   * Validation status of text form of edited expression.
   * Always true if not editing using text.
   * @type {ComputedProperty<Boolean>}
   */
  expressionValid: or(not('expressionEditStarted'), isEmpty('expressionValidationMessage')),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  isValid: and('replicasNumberValid', 'expressionValid', 'queryBuilderValid'),

  qosEvaluationProxy: promise.object(computed(
    'evaluateQosExpression',
    'expressionInfix',
    async function qosEvaluationProxy() {
      const {
        evaluateQosExpression,
        expressionInfix,
      } = this.getProperties('evaluateQosExpression', 'expressionInfix');
      if (expressionInfix) {
        return await evaluateQosExpression(expressionInfix);
      } else {
        return null;
      }
    }
  )),

  componentId: computed(function componentId() {
    return guidFor(this);
  }),

  /**
   * @type {Utils.QueryBuilder.RootOperatorQueryBlock}
   */
  rootQueryBlock: computed(function rootQueryBlock() {
    const rootBlock = RootOperatorQueryBlock.create();
    this.attachRootBlockNotifiers(rootBlock);
    return rootBlock;
  }),

  isValidObserver: observer('update', 'isValid', function isValidObserver() {
    const {
      update,
      isValid,
    } = this.getProperties('update', 'isValid');
    update(undefined, isValid);
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

  expressionInfixChanged(value) {
    if (!this.get('expressionEditStarted')) {
      this.set('expressionEditStarted', true);
    }
    this.set('expressionInfix', value);
    this.notifyUpdate();
  },

  onQueryUpdated() {
    try {
      const rootQueryBlock = this.get('rootQueryBlock');
      const expressionInfix =
        this.set('expressionInfix', queryBlockToQosExpression(rootQueryBlock));
      this.set('queryBuilderValid', Boolean(expressionInfix));
    } catch (error) {
      this.set('queryBuilderValid', false);
    }
    this.notifyUpdate();
  },

  textModeCancel() {
    this.setProperties({
      inputText: '',
      inputMode: 'visual',
    });
  },

  applyTextQuery(value) {
    const {
      globalNotify,
      evaluateQosExpression,
      providers,
      storages,
      queryProperties,
    } = this.getProperties(
      'globalNotify',
      'evaluateQosExpression',
      'providers',
      'storages',
      'queryProperties',
    );
    return evaluateQosExpression(value)
      .catch(error => {
        globalNotify.backendError(this.t('validatingQosExpression'), error);
        throw error;
      })
      .then(({ expressionRpn }) => {
        safeExec(this, () => {
          try {
            const rootBlock = qosRpnToQueryBlock({
              rpnData: expressionRpn,
              queryProperties,
              providers,
              storages,
            });
            this.attachRootBlockNotifiers(rootBlock);
            this.set('rootQueryBlock', rootBlock);
            rootBlock.notifyUpdate();
          } catch (error) {
            globalNotify.backendError(this.t('convertingRpnToBlock'), {
              id: 'cannotConvertQosRpnToQueryBlock',
              details: { convertError: error && error.toString(), expressionRpn },
            });
          }
        });
      });
  },

  /**
   * @param {RootOperatorQueryBlock} rootBlock
   * @returns {Function}
   */
  attachRootBlockNotifiers(rootBlock) {
    return set(rootBlock, 'notifyUpdate', this.onQueryUpdated.bind(this));
  },

  actions: {
    replicasNumberChanged(value) {
      this.set('replicasNumberString', value);
      this.notifyUpdate();
    },
    refreshQueryProperties() {
      return this.get('refreshQueryProperties')();
    },
    enterTextClicked() {
      this.setProperties({
        inputText: '',
        inputMode: 'text',
      });
    },
    textModeOnEdit(open) {
      if (!open) {
        this.textModeCancel();
      }
    },
    textModeApply() {
      return this.applyTextQuery(this.get('inputText'))
        .then(() => {
          safeExec(this, () => {
            this.textModeCancel();
          });
        });
    },
  },
});
