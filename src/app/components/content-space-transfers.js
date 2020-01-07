/**
 * Container for space transfers view to use in an iframe with injected properties.
 * 
 * @module component/content-space-transfers
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import { inject as service } from '@ember/service';
import ContentSpaceBaseMixin from 'oneprovider-gui/mixins/content-space-base';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default OneEmbeddedComponent.extend(
  ContentSpaceBaseMixin, {
    classNames: ['content-space-transfers'],

    store: service(),
    transferManager: service(),

    /**
     * @virtual optional
     * @type {Function}
     */
    containerScrollTop: notImplementedIgnore,

    /**
     * @override
     */
    iframeInjectedProperties: Object.freeze([
      'spaceEntityId',
      'fileEntityId',
      'tab',
    ]),

    actions: {
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
      },
      resetQueryParams() {
        return this.callParent('resetQueryParams');
      },
      changeListTab(tab) {
        return this.callParent('changeListTab', tab);
      },
      closeFileTab() {
        return this.callParent('closeFileTab');
      },
    },
  }
);
