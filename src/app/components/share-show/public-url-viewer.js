/**
 * Selector and copier of public share link type
 * 
 * @module components/share-show/public-url-viewer
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed } from '@ember/object';
import { reads, equal } from '@ember/object/computed';
import { conditional, raw, collect, or, and, tag, bool, array } from 'ember-awesome-macros';
import { promise } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';

export default Component.extend(I18n, {
  i18n: service(),

  classNames: ['share-show-public-url-viewer', 'public-url-viewer'],
  classNameBindings: ['compact', 'selectedUrlTypeClass'],

  /**
   * @override
   */
  i18nPrefix: 'components.shareShow.publicUrlViewer',

  /**
   * @virtual
   * @type {Models.Share}
   */
  share: undefined,

  /**
   * @virtual
   * @type {Boolean}
   */
  showHandle: undefined,

  /**
   * If true, embeds mode selector in copy input and does not display name of handle
   * service.
   * @virtual optional
   * @type {Boolean}
   */
  compact: false,

  /**
   * One of: share, handle, rest.
   * If share - it is a link to Onezone's share.
   * If handle - it is a link to published Open Data (in handle service).
   * If rest - it is a link to REST endpoint, where data about share can be found.
   * @virtual
   * @type {String}
   */
  selectedUrlType: undefined,

  /**
   * @virtual optional
   * @type {(selectedUrlType: String) => undefined)}
   */
  changeSelectedUrlType: notImplementedIgnore,

  /**
   * @type {Boolean}
   */
  compactUrlTypeSelectorOpened: false,

  /**
   * @type {Boolean}
   */
  handleServiceInfoOpened: false,

  /**
   * @type {ComputedProperty<String>}
   */
  selectedUrlTypeIcon: or(
    and(equal('effSelectedUrlType', raw('share')), 'share'),
    and(equal('effSelectedUrlType', raw('handle')), 'globe-cursor'),
    and(equal('effSelectedUrlType', raw('rest')), 'rest'),
  ),

  selectedUrlTypeClass: tag `public-url-viewer-${'effSelectedUrlType'}`,

  effSelectedUrlType: conditional(
    array.includes('availableUrlTypes', 'selectedUrlType'),
    'selectedUrlType',
    raw('share'),
  ),

  /**
   * @type {ComputedProperty<PromiseObject<Models.Handle>>}
   */
  handleProxy: reads('share.handle'),

  /**
   * Can be `null` if working in public mode (user has no access to handle service info).
   * @type {ComputedProperty<PromiseObject<Models.HandleService>>}
   */
  handleServiceProxy: promise.object(computed(async function handleServiceProxy() {
    const handle = await this.get('handleProxy');
    if (handle) {
      return get(handle, 'handleService');
    } else {
      return null;
    }
  })),

  /**
   * Should resolve when all data needed to display URL with optional handle service info
   * are available.
   * @type {ComputedProperty<PromiseObject>}
   */
  handleDataProxy: promise.object(promise.all('handleProxy', 'handleServiceProxy')),

  /**
   * @type {ComputedProperty<Boolean>}
   */
  effShowHandle: bool(and('showHandle', 'handleServiceProxy.name')),

  /**
   * 
   * @type {ComputedProperty<String>}
   */
  urlToCopy: or(
    and(equal('effSelectedUrlType', 'share'), 'share.publicUrl'),
    and(equal('effSelectedUrlType', 'handle'), 'handleProxy.url'),
    and(equal('effSelectedUrlType', 'rest'), 'share.restUrl'),
    '',
  ),

  /**
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectShareAction: computed(function urlTypeSelectShareAction() {
    return {
      title: this.t('linkLabel.share'),
      icon: 'onezone',
      className: 'option-share-link',
      action: () => this.get('changeSelectedUrlType')('share'),
    };
  }),

  /**
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectHandleAction: computed(function urlTypeSelectHandleAction() {
    return {
      title: this.t('linkLabel.handle'),
      icon: 'globe-cursor',
      className: 'option-handle-link',
      action: () => this.get('changeSelectedUrlType')('handle'),
    };
  }),

  /**
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectRestAction: computed(function urlTypeSelectRestAction() {
    return {
      title: this.t('linkLabel.rest'),
      icon: 'rest',
      className: 'option-rest-link',
      action: () => this.get('changeSelectedUrlType')('rest'),
    };
  }),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  availableUrlTypes: conditional(
    'effShowHandle',
    collect(
      raw('share'),
      raw('rest'),
    ),
    collect(
      raw('share'),
      raw('handle'),
      raw('rest')
    ),
  ),

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  compactUrlTypeSelectorActions: conditional(
    'showHandle',
    collect(
      'urlTypeSelectShareAction',
      'urlTypeSelectHandleAction',
      'urlTypeSelectRestAction'
    ),
    collect(
      'urlTypeSelectShareAction',
      'urlTypeSelectRestAction'
    ),
  ),
});
