/**
 * A footer part of archive recall component with some settings, summary and submit button
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { or, tag, conditional, eq, raw, promise, bool } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import computedT from 'onedata-gui-common/utils/computed-t';
import { computed } from '@ember/object';
import resolveFilePath, { stringifyFilePath } from 'oneprovider-gui/utils/resolve-file-path';

export default Component.extend(I18n, {
  classNames: ['archive-recall-footer'],

  /**
   * @override
   */
  i18nPrefix: 'components.archiveRecall.footer',

  i18n: service(),

  /**
   * @virtual
   * @type {Utils.BrowsableDataset}
   */
  dataset: undefined,

  /**
   * Notify and update target file/directory name.
   * @virtual
   * @type {(name: String) => void}
   */
  onTargetNameChange: notImplementedIgnore,

  /**
   * Notify about cancel button clicked.
   * @virtual
   * @type {() => void}
   */
  onCancel: notImplementedIgnore,

  /**
   * Notify about submit button clicked.
   * @virtual
   * @type {() => void}
   */
  onSubmit: notImplementedReject,

  /**
   * Parent directory for root recalled directory to be created.
   * @virtual
   * @type {Models.File}
   */
  parentDir: undefined,

  /**
   * Desired file or directory name of recalled directory root.
   * @virtual
   * @type {String}
   */
  targetName: '',

  /**
   * @virtual
   * @type {Boolean}
   */
  isSubmitting: false,

  /**
   * @virtual optional
   * @type {Boolean}
   */
  disabled: false,

  /**
   * Proxy of error message displayed for name input.
   * @virtual optional
   * @type {PromiseObject<String>}
   */
  nameValidationErrorProxy: null,

  /**
   * @type {ComputedProperty<String>}
   */
  nameValidationError: reads('nameValidationErrorProxy.content'),

  /**
   * Proxy of error message displayed for browser (which should be placed in body above).
   * @virtual optional
   * @type {PromiseObject<String>}
   */
  browserValidationErrorProxy: null,

  /**
   * @type {ComputedProperty<String>}
   */
  browserValidationError: reads('browserValidationErrorProxy.content'),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effInputDisabled: bool(or(
    'disabled',
    'browserValidationErrorProxy.isPending',
    'browserValidationError',
    'isSubmitting',
  )),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effSubmitDisabled: or(
    'disabled',
    'nameValidationErrorProxy.isPending',
    'nameValidationError',
    'browserValidationErrorProxy.isPending',
    'browserValidationError',
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  proceedTip: or('nameValidationError', 'browserValidationError'),

  /**
   * One of: file, dir.
   * Type of target item to be created.
   * @type {ComputedProperty<String>}
   */
  fileType: reads('dataset.rootFileType'),

  fileTypeText: conditional(
    eq('fileType', raw('file')),
    computedT('fileType.file'),
    computedT('fileType.dir')
  ),

  targetNameInputId: tag `${'elementId'}-target-name-input`,

  targetPathStringProxy: promise.object(computed(
    'parentDir.name',
    'targetName',
    async function filePathTip() {
      const {
        parentDir,
        targetName,
      } = this.getProperties('parentDir', 'targetName');
      const parentDirPath = await resolveFilePath(parentDir);
      return stringifyFilePath([
        ...parentDirPath,
        { name: targetName },
      ], 'name');
    }
  )),

  targetPathString: reads('targetPathStringProxy.content'),

  actions: {
    submit() {
      const {
        onSubmit,
        effSubmitDisabled,
      } = this.getProperties('onSubmit', 'effSubmitDisabled');
      if (!effSubmitDisabled) {
        return onSubmit();
      }
    },
  },
});
