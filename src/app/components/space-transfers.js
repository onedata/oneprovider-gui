/**
 * A view component for onedata.transfers.show route
 *
 * @module components/space-transfers
 * @author Jakub Liput
 * @copyright (C) 2017-2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { getOwner } from '@ember/application';
import { isArray } from '@ember/array';
import Component from '@ember/component';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { and, equal, promise, raw } from 'ember-awesome-macros';
import _ from 'lodash';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import generateColors from 'onedata-gui-common/utils/generate-colors';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';

export default Component.extend(I18n, {
  classNames: ['space-transfers', 'row'],
  i18n: service(),
  store: service(),
  onedataConnection: service(),
  transferManager: service(),
  errorExtractor: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers',

  /**
   * Space model, which transfers will be listed
   * @virtual
   * @type {Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  changeListTab: notImplementedWarn,

  /**
   * @virtual
   * @type {Function}
   */
  closeFileTab: notImplementedWarn,

  /**
   * @virtual
   * An ID of file for which a special transfers tab will be created.
   * If undefined/null the tab will not be created
   * @type {string|undefined}
   */
  fileId: undefined,

  /**
   * @virtual
   * @type {String}
   */
  defaultTab: undefined,

  providers: reads('providersProxy.content'),

  /**
   * List of providers that support this space
   * @type {ComputedProperty<Ember.Array<Provider>>}
   */
  providersProxy: promise.array(
    computed('space.providerList.list.[]', function providersProxy() {
      return this.get('space.providerList')
        .then(providerList => get(providerList, 'list'))
        .then(list => list.toArray());
    })
  ),

  // FIXME: falsy isSupportedByOngoingProvider will cause infinite loading
  generalDataLoaded: and(
    equal('isSupportedByOngoingProvider', raw(true)),
    'providersProxy.isSettled',
  ),

  /**
   * Global colors for each provider
   * @type {ComputedProperty<Object>}
   */
  providersColors: computed('providers.@each.entityId', function providersColors() {
    const providers = this.get('providers');
    if (providers) {
      const providerIds = providers.mapBy('entityId').sort();
      const colors = generateColors(providerIds.length + 1);
      return _.assign(
        _.zipObject(providerIds, colors), { unknown: colors[colors.length - 1] }
      );
    }
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  providerId: computed(function providerId() {
    const application = getOwner(this).application;
    if (application) {
      return application.guiContext.clusterId;
    }
  }),

  /**
   * True if transfers can be listed because space is supported by ongoing
   * provider.
   * @type {ComputedProperty<boolean>}
   */
  isSupportedByOngoingProvider: computed(
    'providerId',
    'providers.[]',
    function isSupportedByOngoingProvider() {
      const {
        providers,
        providerId,
      } = this.getProperties('providerId', 'providers');
      if (isArray(providers) && providerId != null) {
        return _.includes(providers.map(p => get(p, 'entityId')), providerId);
      } else {
        return false;
      }
    }
  ),

  spaceChanged: observer('space', function spaceChanged() {
    this._spaceChanged();
  }),

  init() {
    this._super(...arguments);
    this._spaceChanged(true);
    // FIXME: debug
    window.spaceTransfers = this;
  },

  _spaceChanged(isInit = false) {
    if (!isInit) {
      // file tab should not be persisted, because it is probably from other space
      this._clearFileId();
    }
  },

  _clearFileId() {
    return this.get('closeFileTab')();
  },

  actions: {
    closeFileTab() {
      this.set('activeTabId', 'waiting');
      this._clearFileId();
    },

    changeListTab(tab) {
      return this.get('changeListTab')(tab);
    },
  },
});
