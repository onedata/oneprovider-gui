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
   * @virtual
   * @type {Array}
   */
  features: Object.freeze([]),

  /**
   * @virtual
   * @type {Object} browsable object like File or BrowsableDataset
   */
  item: undefined,

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
    this.regenerateComputedHasInheritance();
  },

  actions: {
    inheritanceTagClicked() {
      this.set('expanded', true);
    },
  },
});
