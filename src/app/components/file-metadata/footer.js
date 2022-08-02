import Component from '@ember/component';
import { or, and, not, eq, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { metadataTypes } from 'oneprovider-gui/utils/file-metadata-view-model';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['text-left'],

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.footer',

  /**
   * @virtual
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,

  /**
   * If any value is invalid, we suppose that it must be modified (data from DB cannot
   * be invalid).
   * @type {ComputedProperty<boolean>}
   */
  areSaveButtonsShown: and(
    not('viewModel.effectiveReadonly'),
    or('viewModel.isAnyModified', 'viewModel.isAnyInvalid')
  ),

  saveAllDisabled: or(
    not('viewModel.isAnyModified'),
    'viewModel.isAnyInvalid',
    'viewModel.isAnyValidating'
  ),

  saveAllDisabledMessage: or(
    and('viewModel.isAnyInvalid', computedT('disabledReason.someInvalid')),
    and('viewModel.isAnyValidating', computedT('disabledReason.validating')),
    and(not('viewModel.isAnyModified'), computedT('disabledReason.noChanges')),
  ),

  actions: {
    discardChanges() {
      // FIXME: implement
    },
    async save() {
      return await this.viewModel.save(this.viewModel.activeTab);
    },
  },
});
