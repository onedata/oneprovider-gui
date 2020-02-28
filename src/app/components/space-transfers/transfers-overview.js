/**
 * Shows overview data for all transfers for the space
 * 
 * Automatic sticky on scrolling
 *
 * @module components/space-transfers/transfers-overview
 * @author Jakub Liput
 * @copyright (C) 2018-2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import safeExec from 'onedata-gui-common/utils/safe-method-execution';
import Component from '@ember/component';
import { htmlSafe } from '@ember/string';
import { observer, get } from '@ember/object';
import $ from 'jquery';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend(I18n, {
  classNames: ['transfers-overview', 'row', 'row-spacing'],
  attributeBindings: ['style'],

  /**
   * @override
   */
  i18nPrefix: 'components.spaceTransfers.transfersOverview',

  /**
   * @virtual
   * @type {Models.Space}
   */
  space: undefined,

  /**
   * @virtual
   * @type {Aray<Models.Provider>}
   */
  providers: undefined,

  /**
   * @virtual
   * @type {Object} providerId: String => color: String
   */
  providersColors: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  destinationProviderIds: undefined,

  /**
   * @virtual
   * @type {Array<String>}
   */
  sourceProviderIds: undefined,

  /**
   * Set in `changeStyle`
   * @type {String}
   */
  style: htmlSafe(''),

  /**
   * Set by scroll/resize event handler
   * @type {boolean}
   */
  stickyOverview: undefined,

  /**
   * @type {number}
   */
  contentScrollTop: undefined,

  /**
   * @type {boolean}
   */
  overviewExpanded: false,

  /**
   * Position of expand handler on overview component initialization
   * @type {number}
   */
  initialHandlerTop: undefined,

  /**
   * @type {string}
   */
  throughputTransferType: 'all',

  _window: window,

  /**
   * Set in `updateMobileMode`
   * @type {Boolean}
   */
  _mobileMode: false,

  stickyOverviewChanged: observer('stickyOverview', function stickyOverviewChanged() {
    this.changeStyle();
    this.changeStickyOverviewStyle();
  }),

  overviewExpandedChanged: observer(
    'overviewExpanded',
    function overviewExpandedChanged() {
      if (!this.get('overviewExpanded')) {
        this.computeSticky();
      }
      this.changeStickyOverviewStyle();
    }
  ),

  init() {
    this._super(...arguments);
    // enable observers
    this.getProperties('stickyOverview', 'overviewExpanded');
  },

  didInsertElement() {
    this._super(...arguments);
    scheduleOnce('afterRender', () => {
      this.onResize();
    });
    const $contentScroll = $('#content-scroll');
    this.initSticky($contentScroll);
    $contentScroll.on(
      this.eventName('scroll'),
      () => safeExec(this, 'computeSticky')
    );
    $(window).on(
      this.eventName('resize'),
      () => safeExec(this, () => {
        this.onResize();
      })
    );
  },

  willDestroyElement() {
    this._super(...arguments);
    $('#content-scroll').off(this.eventName('scroll'));
    $(window).off(this.eventName('resize'));
  },

  onResize() {
    this.updateMobileMode();
    this.computeSticky();
    this.changeStyle();
    this.changeStickyOverviewStyle();
  },

  changeStyle() {
    let style;
    if (this.get('stickyOverview')) {
      const $rowActiveTransfers = this.$('.row-active-transfers');
      const height = $rowActiveTransfers.outerHeight();
      const width = this.$().parents('.space-transfers').innerWidth();
      style = htmlSafe(`height: ${height}px; width: ${width}px;`);
    } else {
      style = htmlSafe();
    }
    this.set('style', style);
  },

  changeStickyOverviewStyle() {
    let stickyOverviewStyle;
    if (this.get('stickyOverview')) {
      const {
        contentScrollTop,
        overviewExpanded,
      } = this.getProperties(
        'contentScrollTop',
        'overviewExpanded'
      );
      const $rowOverview = this.$('.row-overview');
      const top = (overviewExpanded ?
        contentScrollTop :
        contentScrollTop - $rowOverview.height()
      );
      const left = this.$().offset().left;
      const right = window.innerWidth - (left + this.$().width());
      const style = `top: ${top}px; left: ${left}px; right: ${right}px;`;
      stickyOverviewStyle = htmlSafe(style);
    }
    this.set('stickyOverviewStyle', stickyOverviewStyle);
  },

  initSticky($contentScroll) {
    const $rowExpandHandler = this.$('.row-expand-handler');
    if ($rowExpandHandler.length) {
      this.set('initialHandlerTop', $rowExpandHandler.offset().top);
    }
    if ($contentScroll && $contentScroll.length) {
      this.set('contentScrollTop', $contentScroll.offset().top);
    }
  },

  /**
   * Check if overview panel should become/stay sticky
   * Should be invoked on view change events (scroll, resize)
   * @returns {undefined}
   */
  computeSticky() {
    const {
      initialHandlerTop,
      contentScrollTop,
      stickyOverview,
      _mobileMode,
    } = this.getProperties(
      'initialHandlerTop',
      'contentScrollTop',
      'stickyOverview',
      '_mobileMode'
    );
    let sticky;
    if (_mobileMode) {
      sticky = false;
    } else {
      const contentScroll = document.getElementById('content-scroll');
      if (contentScroll) {
        sticky = this.get('overviewExpanded') ?
          (contentScroll.scrollTop !== 0) :
          (initialHandlerTop - contentScrollTop <= contentScroll.scrollTop);
      }
    }
    if (!sticky && stickyOverview) {
      this.set('overviewExpanded', false);
    }
    this.set('stickyOverview', sticky);
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
   * Window resize event handler.
   * @type {Ember.ComputedProperty<Function>}
   */
  updateMobileMode() {
    const _window = this.get('_window');
    const innerWidth = get(_window, 'innerWidth');
    const innerHeight = get(_window, 'innerHeight');
    this.set('_mobileMode', innerWidth < 1320 || innerHeight < 580);
  },

  actions: {
    toggleOverview() {
      this.toggleProperty('overviewExpanded');
    },

    stickyFocused() {
      if (!this.get('stickyOverview')) {
        this.$()[0].setAttribute('tabindex', 0);
      }
    },
  },
});
