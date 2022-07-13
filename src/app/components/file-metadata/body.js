/**
 * Shows and allows edit file or directory metadata
 *
 * @author Jakub Liput
 * @copyright (C) 2019-2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';
import { conditional, equal, raw, or, not, eq, and, bool } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import _ from 'lodash';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import { camelize } from '@ember/string';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import { all as allFulfilled } from 'rsvp';
import { capitalize } from '@ember/string';
import { emptyValue, metadataTypes } from 'oneprovider-gui/utils/file-metadata-view-model';

const mixins = [
  I18n,
];

export default Component.extend(...mixins, {
  classNames: ['file-metadata-body'],
  classNameBindings: ['fullVertical:full-height'],

  i18n: service(),
  fileManager: service(),

  open: false,

  /**
   * @override
   */
  i18nPrefix: 'components.fileMetadata.body',

  /**
   * @virtual
   * @type {Utils.FileMetadataViewModel}
   */
  viewModel: undefined,

  /**
   * @type {ComputedProperty<Models.File>}
   */
  file: reads('viewModel.file'),

  metadataTypes: reads('viewModel.metadataTypes'),

  activeTab: reads('viewModel.activeTab'),

  effectiveReadonly: reads('viewModel.effectiveReadonly'),

  tabStateClassTypes: reads('viewModel.tabStateClassTypes'),

  /**
   * @type {ComputedProperty<string>} one of: file, dir
   */
  fileType: reads('file.type'),

  /**
   * @type {ComputedProperty<string>}
   */
  typeTranslation: conditional(
    equal('fileType', raw('file')),
    computedT('file'),
    computedT('dir'),
  ),

  fullVertical: not(eq('activeTab', raw('xattrs'))),

  actions: {
    changeTab(tabId) {
      this.viewModel.changeTab(tabId);
    },
    saveAll() {
      this.viewModel.saveAll();
    },
    metadataChanged(type, data) {
      this.viewModel.onMetadataChanged(type, data);
    },
  },
});
