import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed } from '@ember/object';
import { reads, equal } from '@ember/object/computed';
import { conditional, raw, collect } from 'ember-awesome-macros';
import { promise } from 'ember-awesome-macros';

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
   * @type {String}
   */
  selectedUrlType: undefined,

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
    return get(await this.get('handleProxy'), 'handleService');
  })),

  /**
   * Should resolve when all data needed to display URL with optional handle service info
   * are available.
   * @type {ComputedProperty<PromiseObject>}
   */
  handleDataProxy: promise.object(promise.all('handleProxy', 'handleServiceProxy')),

  urlTypeSelectShareAction: computed(function urlTypeSelectShareAction() {
    return {
      title: this.t('sharePublicLink'),
      icon: 'onezone',
      action: () => this.set('selectedUrlType', 'share'),
    };
  }),

  urlTypeSelectHandleAction: computed(function urlTypeSelectHandleAction() {
    return {
      title: this.t('handlePublicLink'),
      icon: 'globe-cursor',
      action: () => this.set('selectedUrlType', 'handle'),
    };
  }),

  compactUrlTypeSelectorActions: collect(
    'urlTypeSelectShareAction',
    'urlTypeSelectHandleAction'
  ),
});
