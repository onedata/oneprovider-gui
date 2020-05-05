/**
 * Shown when connection test to API fails
 * 
 * @module components/content-endpoint-error
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import OneEmbeddedComponent from 'oneprovider-gui/components/one-embedded-component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import ErrorCheckViewMixin from 'onedata-gui-common/mixins/error-check-view';
import { Promise } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';

export default OneEmbeddedComponent.extend(
  I18n,
  ErrorCheckViewMixin,
  createDataProxyMixin('manageClusterUrl'), {
    classNames: 'content-endpoint-error',
    i18nPrefix: 'components.contentEndpointError',

    i18n: service(),
    guiContext: service(),
    onedataWebsocket: service(),

    _location: location,

    iframeInjectedProperties: Object.freeze([]),

    /**
     * @override
     */
    checkErrorType: 'oneproviderEndpoint',

    /**
     * @override
     */
    resourceId: reads('clusterId'),

    clusterId: reads('guiContext.clusterId'),

    emergencyOnepanelUrl: computed('cluster.standaloneOriginProxy.content',
      function emergencyOnepanelUrl() {
        return this.get('cluster.standaloneOriginProxy.content') + ':9443';
      }
    ),

    didInsertElement() {
      this._super(...arguments);
      this.getTryErrorCheckProxy().then(isError => {
        if (isError === undefined || isError === true) {
          this.showDetailsModal();
        }
      });
    },

    /**
     * @override
     */
    checkError() {
      const onedataWebsocket = this.get('onedataWebsocket');
      return onedataWebsocket.initConnection()
        .then(() => false)
        .catch(() => true)
        .finally(() => {
          onedataWebsocket.closeConnection();
        });
    },

    /**
     * @override
     */
    redirectToIndex() {
      return new Promise(() => {
        this.locationReload();
      });
    },

    locationReload() {
      this.get('_location').reload();
    },

    /**
     * @override
     */
    fetchManageClusterUrl() {
      return this.callParent('getManageClusterUrl', {
        clusterId: this.get('clusterId'),
      });
    },

    showDetailsModal() {
      return this.callParent('showOneproviderConnectionError', {
        oneproviderUrl: `https://${this.get('guiContext.apiOrigin')}`,
      });
    },

    actions: {
      showDetails() {
        this.showDetailsModal();
      },
      tryAgain() {
        this.locationReload();
      },
    },
  });
