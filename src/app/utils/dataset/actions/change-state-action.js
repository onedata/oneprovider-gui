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
  actionContext,
} from 'oneprovider-gui/components/file-browser';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { bool, equal, raw, conditional, or } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { inject as service } from '@ember/service';
import { allSettled } from 'rsvp';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import insufficientPrivilegesMessage from 'onedata-gui-common/utils/i18n/insufficient-privileges-message';

export default BaseAction.extend({
  modalManager: service(),
  globalNotify: service(),
  datasetManager: service(),

  /**
   * @virtual
   * @type {SpacePrivileges}
   */
  spacePrivileges: undefined,

  /**
   * Callback called after successful state change.
   * @virtual optional
   * @type {Function}
   */
  onExecutionCompleted: notImplementedIgnore,

  /**
   * @override
   */
  actionId: 'changeState',

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
    actionContext.currentDir,
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
    computed(
      'spacePrivileges.{manageDatasets,createArchives}',
      function disabledTip() {
        const {
          spacePrivileges,
          i18n,
        } = this.getProperties(
          'spacePrivileges',
          'i18n',
        );
        const hasPrivileges = spacePrivileges.manageDatasets;
        if (!hasPrivileges) {
          return insufficientPrivilegesMessage({
            i18n,
            modelName: 'space',
            privilegeFlag: 'space_manage_datasets',
          });
        }
      }
    )
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
   * @type {ComputedProperty<Boolean>}
   */
  isAnySelectedRootDeleted: computed(
    'attachmentState',
    'selectedItems.@each.rootFileDeleted',
    function isAnySelectedRootDeleted() {
      const {
        attachmentState,
        selectedItems,
      } = this.getProperties('attachmentState', 'selectedItems');
      return attachmentState === 'detached' && selectedItems.isAny('rootFileDeleted');
    }
  ),

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

  askForToggleAttachment(datasets, targetState) {
    const {
      modalManager,
      globalNotify,
    } = this.getProperties('modalManager', 'globalNotify');
    const count = get(datasets, 'length');
    const attach = targetState === 'attached';
    const actionName = (attach ? 'attach' : 'detach');
    const isMulti = count > 1;
    const pluralType = isMulti ? 'multi' : 'single';
    const descriptionKey = `confirmModal.intro.${actionName}.${pluralType}`;
    let descriptionInterpolation;
    if (isMulti) {
      descriptionInterpolation = {
        count,
      };
    } else {
      descriptionInterpolation = {
        name: get(datasets[0], 'name'),
        path: get(datasets[0], 'rootFilePath'),
        fileType: this.t('fileType.' + get(datasets[0], 'rootFileType')),
      };
    }
    const introText = this.t(descriptionKey, descriptionInterpolation);
    return modalManager.show('question-modal', {
      headerIcon: attach ? 'sign-info-rounded' : 'sign-warning-rounded',
      headerText: this.t(
        `confirmModal.header.${pluralType}.${actionName}`
      ),
      descriptionParagraphs: [{
        text: introText,
      }, {
        text: this.t(`confirmModal.generalInfo.${actionName}`),
      }, {
        text: this.t('confirmModal.proceedQuestion'),
      }],
      yesButtonText: this.t('confirmModal.yes'),
      yesButtonType: attach ? 'primary' : 'danger',
      onSubmit: async () => {
        const submitResult = await this.toggleDatasetsAttachment(datasets, attach);
        const firstRejected = submitResult.findBy('state', 'rejected');
        if (firstRejected) {
          const error = get(firstRejected, 'reason');
          globalNotify.backendError(
            this.t('confirmModal.changingState'),
            error
          );
          throw error;
        }
        return submitResult;
      },
    }).hiddenPromise;
    // TODO: VFS-7632 show modal with to links to moved datasets after attach/detach
  },

  async toggleDatasetsAttachment(datasets, attach) {
    const results = await allSettled(datasets.map(async (dataset) => {
      await this.datasetManager.toggleDatasetAttachment(dataset, attach);
      return dataset;
    }));
    const changedDatasets = results.map(result => get(result, 'value')).filter(Boolean);
    try {
      await this.onExecutionCompleted(changedDatasets);
    } catch (error) {
      console.error(
        'toggleDatasetsAttachment: post-processing after toggling attachment failed:',
        error
      );
    }
    return results;
  },
});
