/**
 * Implementation of remove menu action for dataset.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import BaseAction from './-base';
import {
  anySelectedContexts,
} from 'oneprovider-gui/components/file-browser';
import { computed, get } from '@ember/object';
import { reads } from '@ember/object/computed';
import { bool, conditional, gt } from 'ember-awesome-macros';
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
   * Callback called after successful dataset remove.
   * @virtual optional
   * @type {Function}
   */
  onRemoved: notImplementedIgnore,

  /**
   * @override
   */
  actionId: 'remove',

  /**
   * @override
   */
  icon: 'browser-delete',

  /**
   * @override
   */
  showIn: Object.freeze([
    ...anySelectedContexts,
  ]),

  /**
   * @override
   */
  disabled: bool('disabledTip'),

  /**
   * @override
   */
  tip: reads('disabledTip'),

  disabledTip: conditional(
    'selectedDatasetsHaveArchives',
    computedT('tip.notAvailableHaveArchives'),
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

  areMultipleSelected: gt('selectedItems.length', 1),

  selectedDatasetsHaveArchives: computed(
    'selectedItems.@each.archiveCount',
    function selectedDatasetsHaveArchives() {
      const selectedItems = this.get('selectedItems');
      return selectedItems.find(item => get(item, 'archiveCount') > 0);
    }
  ),

  /**
   * @override
   */
  onExecute(selectedItems) {
    return this.askForRemoveDatasets(selectedItems);
  },

  askForRemoveDatasets(datasets) {
    const {
      modalManager,
      globalNotify,
      areMultipleSelected,
    } = this.getProperties('modalManager', 'globalNotify', 'areMultipleSelected');
    const count = get(datasets, 'length');
    const isMulti = areMultipleSelected;
    const descriptionKey = `confirmModal.description.${isMulti ? 'multi' : 'single'}`;
    let descriptionInterpolation;
    if (isMulti) {
      descriptionInterpolation = {
        count,
      };
    } else {
      descriptionInterpolation = {
        name: get(datasets, 'firstObject.name'),
      };
    }
    return modalManager.show('question-modal', {
      headerIcon: 'sign-warning-rounded',
      headerText: this.t('confirmModal.header.' + (isMulti ? 'multi' : 'single')),
      descriptionParagraphs: [{
        text: this.t(descriptionKey, descriptionInterpolation),
      }, {
        text: this.t('confirmModal.proceedQuestion'),
      }],
      yesButtonText: this.t('confirmModal.yes'),
      yesButtonType: 'danger',
      onSubmit: async () => {
        const submitResult = await this.removeDatasets(datasets);
        const firstRejected = submitResult.findBy('state', 'rejected');
        if (firstRejected) {
          const error = get(firstRejected, 'reason');
          globalNotify.backendError(
            this.t('confirmModal.removing'),
            error
          );
          throw error;
        }
        return submitResult;
      },
    }).hiddenPromise;
  },

  async removeDatasets(datasets) {
    const {
      datasetManager,
      onRemoved,
    } = this.getProperties(
      'datasetManager',
      'onRemoved',
    );
    const result = await allSettled(datasets.map(dataset =>
      datasetManager.destroyDataset(dataset)
    ));
    try {
      await onRemoved();
    } catch (error) {
      console.error(
        'removeDatasets: refreshing browser after removing datasets failed:',
        error
      );
    }
    return result;
  },
});
