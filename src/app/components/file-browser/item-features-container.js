/**
 * Basing on `effMembership` to some features like QoS or dataset on browsable item,
 * provides container for displaying feature tags with hidden information about inherited
 * features and an "expand" button for displaying full information.
 *
 * For example: a file have `effQosMembership` property with `directAndAncestor`
 * membership. Initially we want to show only direct "QoS" tag and rest of inherited
 * info collapsed into "expand" button. When user clicks the expand button, full
 * features inheritance information is shown on tags.
 *
 * See child classes for usage examples.
 *
 *
 * @module components/file-browser/item-features-container
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import EmberObject, { computed, observer } from '@ember/object';
import { and, notEqual, raw, not, conditional, array } from 'ember-awesome-macros';
import I18n from 'onedata-gui-common/mixins/components/i18n';

export default Component.extend(I18n, {
  tagName: '',

  /**
   * @override
   */
  i18nPrefix: 'components.fileBrowser.itemFeaturesContainer',

  /**
   * Names of item's properties that can have following states:
   * `'none'`, `'direct'`, `'ancestor'`, `'directAndAncestor'`.
   * For each "feature", a property is added in yielded `displayedState`.
   * @virtual
   * @type {Array<String>}
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

  showInhertedTag: and(
    not('expanded'),
    'hasInheritance',
  ),

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
    const aggregatedData = this.get('features').reduce((obj, featureName) => {
      obj[featureName] = EmberObject.extend({
        container: undefined,
        membership: conditional(
          'container.expanded',
          // just the same as source membership - no need to hide anything
          `container.item.${featureName}`,
          // hide information about ancestor
          conditional(
            array.includes(
              raw(['direct', 'directAndAncestor']),
              `container.item.${featureName}`
            ),
            raw('direct'),
            raw('none')
          ),
        ),
        isShown: and('membership', notEqual(
          'membership',
          raw('none')
        )),
      }).create({ container: this });
      return obj;
    }, {});
    return EmberObject.create(aggregatedData);
  }),

  regenerateComputedHasInheritance: observer(
    'features',
    function regenerateComputedHasInheritance() {
      const features = this.get('features');
      const computedHasInheritance = computed(`item.{${features.join(',')}}`, function hasInheritance() {
        return features.some(feature => {
          const membership = this.get(`item.${feature}`);
          return membership === 'ancestor' || membership === 'directAndAncestor';
        });
      });
      this.hasInheritance = computedHasInheritance;
    }
  ),

  init() {
    this._super(...arguments);
    if (this.get('initiallyExpanded')) {
      this.set('expanded', true);
    }
    this.regenerateComputedHasInheritance();
  },

  actions: {
    inheritanceTagClicked() {
      this.set('expanded', true);
    },
  },
});
