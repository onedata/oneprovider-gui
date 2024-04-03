/**
 * Basing on `effMembership` to some features like QoS or dataset on browsable item,
 * provides container for displaying feature tags with hidden information about inherited
 * features and an "expand" button for displaying full information.
 *
 * For example: a file have `effQosInheritancePath` property with `directAndAncestor`
 * membership. Initially we want to show only direct "QoS" tag and rest of inherited
 * info collapsed into "expand" button. When user clicks the expand button, full
 * features inheritance information is shown on tags.
 *
 * See child classes for usage examples.
 *
 *
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import EmberObject, { computed, observer } from '@ember/object';
import { and, notEqual, raw, not, conditional, array, collect, getBy, or } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/i18n';
import { defineProperty } from '@ember/object';

/**
 * A source from which the feature of file comes from. Typically used by backend for
 * `InheritancePath` properties.
 * - `none` - the file has not this feature at all
 * - `direct` - the feature is applied directly on this file
 * - `directAndAncestor` - the feature is both directly applied on the file and some
 *   ancestor of the file has feature of the same type, so result is a sum of these
 * - `ancestor` - the feature is applied on the file only by some ancestor, not directly
 * @typedef {'none'|'direct'|'directAndAncestor'|'ancestor'} ItemFeatureMembership
 */

/**
 * @typedef {'default'|'warning'|'danger'} ItemFeatureNoticeLevel
 */

/**
 * @typedef {String|Object} ItemFeatureSpec
 * @description A key of feature of the item like `effQosInheritancePath` or object with
 *   additional display configuration for feature. If the feature is specified (like
 *   aforementioned `effQosMembeship`), a browser item (eg. file) provide a property with
 *   that name and one of values: `'none'`, `'direct'`, `'directAndAncestor`` o
 *   `'ancestor'` indicating how the feature is affecting the item. You can also wrap
 *   an item to add features (see: `browserModel.featurizeItem`).
 * @property {String} [key]
 * @property {ItemFeatureNoticeLevel} [noticeLevel]
 */

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.itemFeaturesContainer',

  /**
   * @virtual
   * @type {Utils.BaseBrowserModel}
   */
  browserModel: undefined,

  /**
   * Names of item's properties that can have following states:
   * `'none'`, `'direct'`, `'ancestor'`, `'directAndAncestor'`.
   * For each "feature", a property is added in yielded `displayedState`.
   * You can also wrap original item with additional features - see
   * `browserModel.featurizeItem`.
   * @virtual
   * @type {Array<ItemFeatureSpec>}
   */
  features: Object.freeze([]),

  /**
   * @virtual
   * @type {Object} browsable object like File or BrowsableDataset
   */
  item: undefined,

  /**
   * If set to true, features will be expanded on init.
   * @virtual
   * @type {Boolean}
   */
  initiallyExpanded: false,

  /**
   * If true, full features inheritance info is provided for displayed tags in
   * `displayedState` and expand button is not rendered.
   * @type {Booelan}
   */
  expanded: false,

  /**
   * Initialized on init.
   * @type {ComputedProperty<Boolean>}
   */
  hasInheritance: undefined,

  /**
   * Injected item wrapped by optional browser model method, that adds contextual
   * features.
   * @type {ComputedProperty<EmberObject>}
   */
  itemWithFeatures: computed(
    'item',
    'browserModel',
    function itemWithFeatures() {
      const {
        item,
        browserModel,
      } = this.getProperties('item', 'browserModel');
      return browserModel && browserModel.featurizeItem ?
        browserModel.featurizeItem(item) : item;
    }
  ),

  showInhertedTag: and(
    not('expanded'),
    'hasInheritance',
  ),

  /**
   * States that indicates that feature is present in any state.
   * @type {ComputedProperty<Array<ItemFeatureMembership>>}
   */
  activeStates: raw(['direct', 'directAndAncestor', 'ancestor']),

  /**
   * Provides features inheritance information that should be shown on tags.
   * Has property for each provided `features` in `features`.
   * For example for features: `effFooMembership` and `effBarMembership`, object
   * with following structure can be generated:
   * ```
   * {
   *   effFooMembership: {
   *     membership: 'direct', // inheritance state that should be displayed at the moment
   *     isShown: true, // should tag be shown at all?
   *   },
   *   effBarMembership: {
   *     membership: 'none',
   *     isShown: false,
   *   }
   * }
   * ```
   * Computed properties for features:
   * - `membership: String` one of: none, direct
   * - `isShown: Boolean`
   * @type {ComputedProperty<EmberObject>}
   */
  displayedState: computed('features.[]', function displayedState() {
    const aggregatedData = this.get('features').reduce((obj, featureSpec) => {
      const {
        key: featureName,
        noticeLevel,
      } = this.normalizeItemFeatureSpec(featureSpec);
      if (!featureName) {
        return obj;
      }
      obj[featureName] = EmberObject.extend({
        /**
         * Provides following data to observe:
         * - `expanded: Boolean`
         * - `itemWithFeatures: EmberObject`
         * - `activeStates: Array<String>`
         * ItemFeaturesContainer implements this interface.
         */
        container: undefined,
        /**
         * Currently visible membership.
         * Note, that if container is collapsed, membership is not visible,
         * so it is virtually "none".
         * @type {ComputedProperty<ItemFeatureMembership>}
         */
        membership: conditional(
          'container.expanded',
          // just the same as source membership - no need to hide anything
          `container.itemWithFeatures.${featureName}`,
          // hide information about ancestor
          conditional(
            array.includes(
              raw(['direct', 'directAndAncestor']),
              `container.itemWithFeatures.${featureName}`
            ),
            raw('direct'),
            raw('none')
          ),
        ),
        /**
         * True if feature tag should be not hidden.
         * @type {ComputedProperty<Boolean>}
         */
        isShown: and('membership', notEqual(
          'membership',
          raw('none')
        )),
        /**
         * True if feature state is anything than "none".
         * @type {ComputedProperty<Boolean>}
         */
        isActive: array.includes(
          'container.activeStates',
          `container.itemWithFeatures.${featureName}`
        ),
        /**
         * @type {ItemFeatureNoticeLevel}
         */
        noticeLevel,
      }).create({ container: this });
      return obj;
    }, {});
    return EmberObject.create(aggregatedData);
  }),

  /**
   * @type {ComputedProperty<ItemFeatureNoticeLevel>}
   */
  activeNoticeLevel: computed('activeFeatures', function activeNoticeLevel() {
    const activeFeatures = this.get('activeFeatures');
    const levels = activeFeatures.map(spec =>
      this.normalizeItemFeatureSpec(spec).noticeLevel
    );
    return levels.includes('danger') && 'danger' ||
      levels.includes('warning') && 'warning' ||
      'default';
  }),

  tagNoticeLevelClass: or(
    getBy(
      raw({
        warning: 'file-status-tag-warning',
        danger: 'file-status-tag-danger',
      }),
      'activeNoticeLevel'
    ),
    raw('file-status-tag-inherited')
  ),

  tagClasses: array.concat(
    collect('tagNoticeLevelClass'),
    raw([
      'file-status-tag',
      'file-status-tag-icon',
      'file-status-tag-icon-only',
      'file-status-inherited',
      'file-status-inherited-collapsed',
    ]),
  ),

  tagClassName: array.join('tagClasses', raw(' ')),

  regenerateComputedHasInheritance: observer(
    'features',
    function regenerateComputedHasInheritance() {
      const features = this.get('features');
      const featuresNames = features.map(featureSpec =>
        this.normalizeItemFeatureSpec(featureSpec).key
      );
      const computedHasInheritance = computed(
        `itemWithFeatures.{${featuresNames.join(',')}}`,
        function hasInheritance() {
          return featuresNames.some(featureName => {
            const membership = this.get(`itemWithFeatures.${featureName}`);
            return membership === 'ancestor' || membership === 'directAndAncestor';
          });
        }
      );
      defineProperty(
        this,
        'hasInheritance',
        computedHasInheritance
      );
    }
  ),

  regenerateComputedActiveFeatures: observer(
    'features',
    function regenerateComputedActiveFeatures() {
      const property = this.createArchiveFeaturesProperty();
      defineProperty(
        this,
        'activeFeatures',
        property,
      );
    }
  ),

  init() {
    this._super(...arguments);
    if (this.get('initiallyExpanded')) {
      this.set('expanded', true);
    }
    this.regenerateComputedHasInheritance();
    this.regenerateComputedActiveFeatures();
  },

  createArchiveFeaturesProperty() {
    const features = this.get('features');
    const featuresNames = features.map(spec => this.normalizeItemFeatureSpec(spec).key);
    return computed(
      ...featuresNames.map(featureName => `displayedState.${featureName}.isActive`),
      function activeFeatures() {
        return features.filter(spec => {
          const featureName = this.normalizeItemFeatureSpec(spec).key;
          return this.get(`displayedState.${featureName}.isActive`);
        });
      }
    );
  },

  /**
   * @param {ItemFeatureSpec} featureSpec
   * @returns {{ key, noticeLevel }}
   */
  normalizeItemFeatureSpec(featureSpec) {
    const isStringSpec = typeof featureSpec === 'string';
    const key = isStringSpec ?
      featureSpec : (featureSpec && featureSpec.key);
    const noticeLevel = (
      !isStringSpec && featureSpec && featureSpec.noticeLevel
    ) || 'default';
    return { key, noticeLevel };
  },

  actions: {
    inheritanceTagClicked() {
      this.set('expanded', true);
    },
  },
});
