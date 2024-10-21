/**
 * A view component for onedata.transfers.show route
 *
 * @author Jakub Liput
 * @copyright (C) 2017-2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { isArray } from '@ember/array';
import Component from '@ember/component';
import { computed, get, observer } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { promise } from 'ember-awesome-macros';
import _ from 'lodash';
import I18n from 'onedata-gui-common/mixins/i18n';
import ColorGenerator from 'onedata-gui-common/utils/color-generator';
import notImplementedWarn from 'onedata-gui-common/utils/not-implemented-warn';
import globals from 'onedata-gui-common/utils/globals';
import WindowResizeHandler from 'onedata-gui-common/mixins/window-resize-handler';
import config from 'ember-get-config';

const mixins = [
  I18n,
  WindowResizeHandler,
];

export default Component.extend(...mixins, {
  classNames: ['space-transfers', 'row'],
  i18n: service(),
  guiContext: service(),

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
  tab: undefined,

  /**
   * @type {number}
   */
  windowWidth: undefined,

  /**
   * @type {number}
   */
  windowHeight: undefined,

  /**
   * @type {string}
   */
  transfersTabType: 'list',

  /**
   * @type {ComputedProperty<Utils.ColorGenerator>}
   */
  colorGenerator: computed(() => new ColorGenerator()),

  providers: reads('providersProxy.content'),

  /**
   * List of providers that support this space.
   * @type {ComputedProperty<Ember.Array<Provider>>}
   */
  providersProxy: promise.array(
    computed(function providersProxy() {
      return this.get('space').getRelation('providerList')
        .then(providerList => get(providerList, 'list'));
    })
  ),

  /**
   * Global colors for each provider
   * @type {ComputedProperty<Object>}
   */
  providersColors: computed('providers.@each.entityId', 'colorGenerator', function providersColors() {
    const {
      providers,
      colorGenerator,
    } = this.getProperties('providers', 'colorGenerator');
    if (providers) {
      const providerIds = providers.mapBy('entityId').sort();
      const colors = providerIds.map((providerId) =>
        colorGenerator.generateColorForKey(providerId)
      );
      return _.assign(_.zipObject(providerIds, colors), {
        unknown: colorGenerator.generateColorForKey('unknown'),
      });
    }
  }),

  /**
   * @type {ComputedProperty<String>}
   */
  providerId: computed(function providerId() {
    return this.get('guiContext.clusterId');
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

  /**
   * @type {ComputedProperty<boolean>}
   */
  areTabLabelsShort: computed('windowWidth', function areTabLabelsShort() {
    return this.windowWidth < 650;
  }),

  spaceChanged: observer('space', function spaceChanged() {
    this._spaceChanged();
  }),

  init() {
    this._super(...arguments);
    this.attachWindowResizeHandler();
    this._spaceChanged(true);
  },

  didInsertElement() {
    this._super(...arguments);
    this.storeWindowSize();
  },

  /**
   * @override
   */
  willDestroy() {
    this._super(...arguments);
    this.detachWindowResizeHandler();
  },

  onWindowResize() {
    this.storeWindowSize();
  },

  _spaceChanged(isInit = false) {
    if (!isInit) {
      // file tab should not be persisted, because it is probably from other space
      this.get('closeFileTab')();
    }
  },

  /**
   * Event name for jQuery associated with this component
   * @param {string} type type, aka. `eventName` (eg. scroll)
   * @returns {string}
   */
  eventName(type) {
    return `${type}.${this.elementId}`;
  },

  /**
   * Sets window width and height in component properties.
   * In test mode it sets fake sizes to make tests stable on every window size.
   */
  storeWindowSize() {
    if (config.environment === 'test') {
      // TODO: VFS-12089 This is a workaround, but the component can be improved using
      // ResizeObserver and checking the element size instead of size of window.
      this.setProperties({
        windowWidth: 1280,
        windowHeight: 768,
      });
    } else {
      this.setProperties({
        windowWidth: globals.window.innerWidth,
        windowHeight: globals.window.innerHeight,
      });
    }
  },

  actions: {
    closeFileTab() {
      this.get('closeFileTab')();
    },

    changeListTab(tab) {
      return this.get('changeListTab')(tab);
    },
  },
});
