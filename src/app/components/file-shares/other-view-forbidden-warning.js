/**
 * Displays warning about POSIX permissions not allowing to read the file in public
 * (if needed).
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import isPosixViewForbidden from 'oneprovider-gui/utils/is-posix-view-forbidden';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import FileConsumerMixin from 'oneprovider-gui/mixins/file-consumer';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';

const mixins = [
  I18n,
  FileConsumerMixin,
];

export default Component.extend(...mixins, {
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
   * @override
   * @implements {Mixins.FileConsumer}
   */
  fileRequirements: computed('file', function fileRequirements() {
    if (!this.file) {
      return [];
    }
    return [
      new FileRequirement({
        fileGri: this.get('file.id'),
        properties: ['posixPermissions'],
      }),
    ];
  }),

  /**
   * @override
   * @implements {Mixins.FileConsumer}
   */
  usedFiles: computed('file', function usedFiles() {
    return this.file ? [this.file] : [];
  }),

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
