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
import { Promise, resolve } from 'rsvp';
import createDataProxyMixin from 'onedata-gui-common/utils/create-data-proxy-mixin';
import Looper from 'onedata-gui-common/utils/looper';

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
     * @type {number}
     */
    requestCounter: 0,

    /**
     * @type {number}
     */
    requestSlowInterval: 5000,

    /**
     * @type {number}
     */
    requestFastInterval: 500,

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

    onepanelConfigurationUrl: computed('guiContext.apiOrigin',
      function onepanelConfigurationUrl() {
        return `https://${this.get('guiContext.apiOrigin')}` +
          '/api/v3/onepanel/configuration';
      }
    ),

    init() {
      this._super(...arguments);
      const timeUpdater = new Looper({
        immediate: false,
        interval: this.get('requestSlowInterval'),
      });
      timeUpdater.on('tick', () => this.checkConnectionToProvider());
      this.set('timeUpdater', timeUpdater);
    },

    didInsertElement() {
      this._super(...arguments);
      this.getTryErrorCheckProxy().then(isError => {
        if (isError === undefined || isError === true) {
          this.showDetailsModal();
        }
      });
    },

    destroy() {
      try {
        this.destroyTimeUpdater();
      } finally {
        this._super(...arguments);
      }
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
      try {
        this.callParent('hideOneproviderConnectionError');
      } finally {
        this.get('_location').reload();
      }
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
        setFastPollingCallback: this.setFastPolling.bind(this),
      });
    },

    setFastPolling(setFastInterval) {
      if (setFastInterval) {
        this.set('timeUpdater.interval', this.get('requestFastInterval'));
        this.set('requestCounter', 0);
      }
    },

    checkConnectionToProvider() {
      resolve($.get(this.get('onepanelConfigurationUrl')))
        .then(() => {
          this.destroyTimeUpdater();
          this.locationReload();
        })
        .catch(() => []);
      if (this.get('timeUpdater.interval') == this.get('requestFastInterval')) {
        const requestCounter = this.get('requestCounter');
        if (requestCounter < 10) {
          this.set('requestCounter', requestCounter + 1);
        } else {
          this.set('timeUpdater.interval', this.get('requestSlowInterval'));
        }
      }
    },

    destroyTimeUpdater() {
      const timeUpdater = this.get('timeUpdater');
      if (timeUpdater) {
        timeUpdater.destroy();
      }
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
