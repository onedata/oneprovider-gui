/**
 * A modal that allows to select workflow to run using passed data. modalOptions:
 * - atmWorkflowInputDataSource - (optional) source of data passed to use in workflow.
 *   If not specified, then passed data will be ignored.
 * - atmWorkflowInputData - (optional) data to pass to the new workflow run.
 *
 * @module components/modals/run-workflow-modal
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default Component.extend(I18n, {
  tagName: '',

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.modals.runWorkflowModal',

  /**
   * @virtual
   * @type {String}
   */
  modalId: undefined,

  /**
   * Is described in the file header
   * @virtual
   * @type {Object}
   */
  modalOptions: undefined,

  /**
   * May be empty or one of: `'filesSelection'`
   * @type {ComputedProperty<String|undefined>}
   */
  atmWorkflowInputDataSource: reads('modalOptions.atmWorkflowInputDataSource'),

  /**
   * @type {ComputedProperty<any>}
   */
  atmWorkflowInputData: reads('modalOptions.atmWorkflowInputData'),
});
