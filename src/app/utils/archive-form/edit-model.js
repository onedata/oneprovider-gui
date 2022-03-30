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

export default ArchiveFormViewModel.extend({
  archiveManager: service(),

  isModified: reads('rootFieldGroup.isModified'),

  init() {
    this._super(...arguments);
    const {
      rootFieldGroup,
      configField,
      descriptionField,
    } = this.getProperties(
      'rootFieldGroup',
      'configField',
      'descriptionField',
    );
    const archiveDescription = this.get('archive.description');
    rootFieldGroup.changeMode('edit');
    configField.changeMode('view');
    const origOnFocustLost = descriptionField.onFocusLost;
    const origOnValueChange = descriptionField.onValueChange;
    descriptionField.onFocusLost = function onFocusLost() {
      origOnFocustLost.apply(this, arguments);
      if (this.dumpValue() === archiveDescription) {
        this.markAsNotModified();
      }
    };
    descriptionField.onValueChange = function onValueChange() {
      origOnValueChange.apply(this, arguments);
      if (this.dumpValue() === archiveDescription) {
        this.markAsNotModified();
      }
    };
  },
});
