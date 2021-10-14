import Component from '@ember/component';
import EmberObject, { computed } from '@ember/object';
import { and, notEqual, raw, not, conditional, array } from 'ember-awesome-macros';

export default Component.extend({
  tagName: '',

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

  init() {
    this._super(...arguments);

    // FIXME: generate using observer, because features can change
    const features = this.get('features');
    const computedHasInheritance = computed(`item.{${features.join(',')}}`, function hasInheritance() {
      return features.some(feature => {
        const membership = this.get(`item.${feature}`);
        return membership === 'ancestor' || membership === 'directAndAncestor';
      });
    });
    this.hasInheritance = computedHasInheritance;
  },

  actions: {
    inheritanceTagClicked() {
      this.set('expanded', true);
    },
  },
});
