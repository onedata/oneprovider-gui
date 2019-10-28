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
import { computed } from '@ember/object';
import { promise } from 'ember-awesome-macros';
import { all as allFulfilled } from 'rsvp';

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
    iframeInjectedProperties: Object.freeze(['spaceEntityId']),

    // FIXME: debug method
    shownTransfers: promise.array(
      computed('spaceProxy.content', function shownTransfers() {
        if (this.get('spaceProxy.isFulfilled')) {
          const store = this.get('store');
          return this.get('transferManager').getTransfersForSpace(
            this.get('spaceProxy.content'),
            'ended',
            null,
            100,
            0,
          ).then(({ list }) => allFulfilled(
            list.map(gri => store.findRecord('transfer', gri))
          ));
        }
      })
    ),

    actions: {
      containerScrollTop() {
        return this.get('containerScrollTop')(...arguments);
      },
    },
  }
);
