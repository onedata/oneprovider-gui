/**
 * Show basic information about file or directory
 * 
 * @module components/file-browser/fb-info-modal
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { reads } from '@ember/object/computed';
import { conditional, equal, promise, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { computed, get } from '@ember/object';
import resolveFilePath from 'oneprovider-gui/utils/resolve-file-path';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  i18n: service(),

  open: false,

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.fbInfoModal',

  /**
   * @virtual
   * @type {models/file}
   */
  file: undefined,

  /**
   * @virtual
   * Callback when the modal is starting to hide
   * @type {Function}
   */
  onHidden: notImplementedIgnore,

  itemType: reads('file.type'),

  typeTranslation: conditional(
    equal('itemType', raw('file')),
    computedT('file'),
    computedT('dir'),
  ),

  fileName: reads('file.name'),

  cdmiObjectId: reads('file.cdmiObjectId'),

  modificationTime: reads('file.modificationTime'),

  ownerFullNameProxy: promise.object(
    computed('file.owner', function ownerFullNamePromise() {
      return this.get('file.owner').then(owner => get(owner, 'fullName'));
    })
  ),

  filePathProxy: promise.object(
    computed('file.parent', function filePathPromise() {
      return resolveFilePath(this.get('file'))
        .then(path => path.mapBy('name').join('/'));
    })
  ),

  cdmiRowId: computed('elementId', function cdmiRowId() {
    return this.get('elementId') + '-row-cdmi';
  }),

  actions: {
    close() {
      return this.get('onHidden')();
    },
  },
});
