import Component from '@ember/component';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import notImplementedReject from 'onedata-gui-common/utils/not-implemented-reject';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { or, tag, conditional, eq, raw } from 'ember-awesome-macros';
import { reads } from '@ember/object/computed';
import computedT from 'onedata-gui-common/utils/computed-t';

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
   * @virtual optional
   * @type {String}
   */
  validationError: null,

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effDisabled: or('disabled', 'validationError'),

  /**
   * @type {ComputedProperty<String>}
   */
  proceedTip: reads('validationError'),

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
});
