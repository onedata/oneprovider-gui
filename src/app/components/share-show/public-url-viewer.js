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
import { conditional, raw, collect } from 'ember-awesome-macros';
import { promise } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';

export default Component.extend(I18n, {
  classNames: ['share-show-public-url-viewer', 'public-url-viewer'],
  classNameBindings: ['compact'],

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
   * One of: share, handle.
   * If share - it is a link to Onezone's share.
   * If handle - it is a link to published Open Data (in handle service).
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
  urlTypeIcon: conditional(
    equal('selectedUrlType', raw('share')),
    raw('onezone'),
    raw('globe-cursor'),
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
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectShareAction: computed(function urlTypeSelectShareAction() {
    return {
      title: this.t('sharePublicLink'),
      icon: 'onezone',
      action: () => this.get('changeSelectedUrlType')('share'),
    };
  }),

  /**
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectHandleAction: computed(function urlTypeSelectHandleAction() {
    return {
      title: this.t('handlePublicLink'),
      icon: 'globe-cursor',
      action: () => this.get('changeSelectedUrlType')('handle'),
    };
  }),

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  compactUrlTypeSelectorActions: collect(
    'urlTypeSelectShareAction',
    'urlTypeSelectHandleAction'
  ),
});
