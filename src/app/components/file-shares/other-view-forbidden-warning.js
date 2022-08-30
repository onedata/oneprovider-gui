// FIXME: jsdoc

import Component from '@ember/component';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  classNames: ['file-shares-other-view-forbidden-warning'],

  i18n: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.fileShares.otherViewForbiddenWarning',

  /**
   * @virtual
   * @type {Models.File}
   */
  file: undefined,

  /**
   * @type {'present'|'future'}
   */
  aboutTimeType: 'present',

  isViewForOtherForbidden: computed(
    'file.{type,posixPermissions}',
    function isViewForOtherForbidden() {
      const octalNumber = 2;
      return isPosixViewForbidden(this.file, octalNumber);
    }
  ),
});
