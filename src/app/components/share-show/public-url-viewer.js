/**
 * Selector and copier of public share link type
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */
import Component from '@ember/component';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import { get, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { conditional, raw, collect, and, tag, bool, array, not, equal } from 'ember-awesome-macros';
import { promise } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';

export const iconForUrlType = {
  share: 'browser-share',
  handle: 'globe-cursor',
  rest: 'rest',
};

export default Component.extend(I18n, {
  i18n: service(),
  restApiGenerator: service(),

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
   * @virtual
   * @type {Boolean}
   */
  testMode: false,

  /**
   * @type {Boolean}
   */
  compactUrlTypeSelectorOpened: false,

  /**
   * @type {Boolean}
   */
  urlTypeInfoOpened: false,

  /**
   * @type {ComputedProperty<String>}
   */
  effSelectedUrlType: conditional(
    array.includes('availableUrlTypes', 'selectedUrlType'),
    'selectedUrlType',
    raw('share'),
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  selectedUrlTypeIcon: computed('effSelectedUrlType',
    function selectedUrlTypeIcon() {
      return iconForUrlType[this.get('effSelectedUrlType')];
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  selectedUrlTypeClass: tag `public-url-viewer-${'effSelectedUrlType'}`,

  /**
   * @type {ComputedProperty<String>}
   */
  urlTypeInfoContentClass: tag `url-type-info-content-${'effSelectedUrlType'}`,

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
  effShowHandle: bool(and('showHandle', 'handleProxy.isFulfilled')),

  /**
   * @type {ComputedProperty<String>}
   */
  urlToCopy: computed(
    'effSelectedUrlType',
    'share.{publicUrl,publicRestUrl}',
    'handleProxy.url',
    function urlToCopy() {
      switch (this.get('effSelectedUrlType')) {
        case 'share':
          return this.get('share.publicUrl');
        case 'handle':
          return this.get('handleProxy.url');
        case 'rest':
          return this.get('restApiGenerator').curlize(this.get('share.publicRestUrl'));
        default:
          return '';
      }
    }
  ),

  /**
   * @type {ComputedProperty<String>}
   */
  typeInfoTriggerText: conditional(
    and(
      not('compact'),
      equal('effSelectedUrlType', raw('handle')),
    ),
    'handleServiceProxy.name',
    raw(''),
  ),

  /**
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectShareAction: createChangeModeAction('share'),

  /**
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectHandleAction: createChangeModeAction('handle'),

  /**
   * @type {ComputedProperty<Object>}
   */
  urlTypeSelectRestAction: createChangeModeAction('rest'),

  /**
   * @type {ComputedProperty<Array<String>>}
   */
  availableUrlTypes: conditional(
    'effShowHandle',
    raw(['share', 'handle', 'rest']),
    raw(['share', 'rest'])
  ),

  /**
   * @type {ComputedProperty<Array<Object>>}
   */
  compactUrlTypeSelectorActions: conditional(
    'effShowHandle',
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

  /**
   * @override
   */
  didInsertElement() {
    this._super(...arguments);

    const {
      element,
      testMode,
    } = this.getProperties('element', 'testMode');

    if (testMode) {
      element.componentInstance = this;
    }
  },
});

function createChangeModeAction(urlType) {
  return computed(function changeModeAction() {
    return {
      title: this.t(`linkLabel.${urlType}`),
      icon: iconForUrlType[urlType],
      className: `option-${urlType}-link`,
      action: () => this.get('changeSelectedUrlType')(urlType),
    };
  });
}
