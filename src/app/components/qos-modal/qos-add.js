/**
 * Form for creating new QoS record
 * 
 * @module components/qos-modal/qos-add
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import EmberObject, { get, computed, set } from '@ember/object';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { not, or, notEmpty, conditional, isEmpty, and, number, promise } from 'ember-awesome-macros';
import { guidFor } from '@ember/object/internals';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import computedT from 'onedata-gui-common/utils/computed-t';
import { inject as service } from '@ember/service';
import createQosParametersSuggestions from 'oneprovider-gui/utils/create-qos-parameters-suggestions';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import queryBlockToQosExpression from 'oneprovider-gui/utils/query-block-to-qos-expression';
import RootOperatorQueryBlock from 'onedata-gui-common/utils/query-builder/root-operator-query-block';
// FIXME: debug code
// import ConditionQueryBlock from 'onedata-gui-common/utils/query-builder/condition-query-block';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import qosRpnToQueryBlock from 'oneprovider-gui/utils/qos-rpn-to-query-block';
import { all as allFulfilled } from 'rsvp';

const mixins = [
  I18n,
  createDataProxyMixin('queryProperties'),
  createDataProxyMixin('storages'),
];

export default Component.extend(...mixins, {
  spaceManager: service(),
  providerManager: service(),
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
   * @type {Function}
   */
  evaluateQosExpression: notImplementedReject,

  replicasNumberString: '1',

  replicasNumber: number('replicasNumberString'),

  expressionInfix: '',

  expressionEditStarted: false,

  /**
   * @type {Boolean}
   */
  qosSuggestionsOpen: false,

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
    // FIXME: development test
    // const condition = ConditionQueryBlock.create({
    //   property: {
    //     key: 'priority',
    //     numberValues: [1, 2, 3, 4, 5],
    //     stringValues: [],
    //     allValues: [1, 2, 3, 4, 5],
    //     type: 'numberOptions',
    //   },
    //   comparator: 'numberOptions.eq',
    //   comparatorValue: 2,
    // });
    return RootOperatorQueryBlock.create({
      // operands: [condition],
      notifyUpdate: this.onQueryUpdated.bind(this),
    });
  }),

  /**
   * @override
   * For resolved object format see: `service:space-manager#getAvailableQosParameters`
   * @returns {Promise<Object>}
   */
  fetchQueryProperties() {
    const {
      spaceManager,
      providerManager,
      spaceId,
    } = this.getProperties('spaceManager', 'providerManager', 'spaceId');
    return spaceManager.getAvailableQosParameters(spaceId)
      .then(availableQosParameters => {
        const suggestions = createQosParametersSuggestions(availableQosParameters);
        const promises = [];
        suggestions.forEach(suggestion => {
          switch (get(suggestion, 'key')) {
            case 'storageId':
              // FIXME: i18n
              set(suggestion, 'displayedKey', 'storage');
              set(suggestion, 'isSpecialKey', true);
              promises.push(this.get('storagesProxy').then(storages => {
                const storageIds = get(suggestion, 'allValues');
                for (let i = 0; i < storageIds.length; ++i) {
                  const storageId = storageIds[i];
                  const storage = storages.findBy('id', storageId);
                  storageIds[i] = storage;
                }
              }));
              break;
            case 'providerId': {
              set(suggestion, 'displayedKey', 'provider');
              set(suggestion, 'isSpecialKey', true);
              const providerIds = get(suggestion, 'allValues');
              for (let i = 0; i < providerIds.length; ++i) {
                const providerId = providerIds[i];
                const currentIndex = i;
                promises.push(
                  providerManager.getProviderById(providerId).then(provider => {
                    providerIds[currentIndex] = provider;
                  })
                );
              }
            }
            break;
          default:
            break;
          }
        });
        return allFulfilled(promises).then(() => {
          if (suggestions) {
            return [...suggestions, anyStorageQueryParameter];
          } else {
            return [anyStorageQueryParameter];
          }
        });
      });
  },

  fetchStorages() {
    const {
      spaceManager,
      spaceId,
    } = this.getProperties('spaceManager', 'spaceId');
    return spaceManager.getSupportingStorages(spaceId);
  },

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

  toggleQosSuggestions(open) {
    const globalNotify = this.get('globalNotify');
    if (open) {
      return this.updateQueryPropertiesProxy({ replace: true })
        .catch(error => {
          globalNotify.backendError(this.t('fetchingSuggestions'), error);
          throw error;
        })
        .then(() => {
          safeExec(this, 'set', 'qosSuggestionsOpen', true);
        });
    } else {
      this.set('qosSuggestionsOpen', false);
    }
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
      this.set('isValid', Boolean(expressionInfix));
    } catch (error) {
      this.set('isValid', false);
    }
    this.notifyUpdate();
  },

  textModeCancel() {
    this.set('inputText', '');
    this.set('inputMode', 'visual');
  },

  applyTextQuery(value) {
    const globalNotify = this.get('globalNotify');
    return this.get('evaluateQosExpression')(value)
      .catch(error => {
        globalNotify.backendError(this.t('validatingQosExpression'), error);
        throw error;
      })
      .then(({ expressionRpn }) => {
        safeExec(this, () => {
          const rootBlock = qosRpnToQueryBlock(expressionRpn);
          set(rootBlock, 'notifyUpdate', this.onQueryUpdated.bind(this));
          this.set('rootQueryBlock', rootBlock);
          rootBlock.notifyUpdate();
        });
      });
  },

  actions: {
    replicasNumberChanged(value) {
      this.set('replicasNumberString', value);
      this.notifyUpdate();
    },
    toggleQosSuggestions(open = true) {
      return this.toggleQosSuggestions(open);
    },
    refreshQueryProperties() {
      return this.updateQueryPropertiesProxy({ replace: true });
    },
    copyExpression() {
      this.$('.expression-clipboard-btn').trigger('click');
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
          this.textModeCancel();
        });
    },
  },
});

// FIXME: i18n
// FIXME: isSpecialKey - do not use both in type and isSpecialKey - rather "symbol" or something
const anyStorageQueryParameter = EmberObject.create({
  key: 'anyStorage',
  displayedKey: 'any storage',
  isSpecialKey: true,
  type: 'specialKey',
});
