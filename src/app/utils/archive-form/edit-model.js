/**
 * Configuration of archive form for editing existing archive settings.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import ArchiveFormViewModel from 'oneprovider-gui/utils/archive-form/view-model';
import { get, computed } from '@ember/object';

export default ArchiveFormViewModel.extend({
  archiveManager: service(),

  isModified: reads('rootFieldGroup.isModified'),

  rootFormGroupClass: computed(function rootFormGroupClass() {
    const archiveDescription = this.get('archive.description');
    const baseClass = this._super(...arguments);
    return baseClass.extend({
      onValueChange(value, field) {
        this._super(...arguments);
        if (get(field, 'name') === 'description' && value === archiveDescription) {
          field.markAsNotModified();
        }
      },
      onFocusLost(field) {
        this._super(...arguments);
        if (get(field, 'name') === 'description') {
          field.markAsNotModified();
        }
      },
    });
  }),

  init() {
    this._super(...arguments);
    const {
      rootFieldGroup,
      configField,
    } = this.getProperties(
      'rootFieldGroup',
      'configField',
    );
    rootFieldGroup.changeMode('edit');
    configField.changeMode('view');
  },
});
