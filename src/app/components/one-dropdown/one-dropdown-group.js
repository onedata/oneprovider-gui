// FIXME: jsdoc
// FIXME: to ma być w commonie
import PowerSelectGroup from 'ember-power-select/components/power-select/power-select-group';
import { computed } from '@ember/object';
import { bool, reads } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';

export default class OneDropdownSelectGroup extends PowerSelectGroup {
  tagName = 'li';
  // FIXME: przemianować na one-dropdown-group-collapsible
  classNames = [
    'ember-power-select-group',
    'one-dropdown-group',
    'one-dropdown-group-collapsible',
  ];
  classNameBindings = ['collapseClass', 'allGroupsOpened:all-groups-opened'];
  attributeBindings = ['ariaDisabled', 'role'];

  role = 'option';

  @tracked isCollapsed = true;

  init() {
    super.init(...arguments);
    if (this.group.options.includes(this.select.selected)) {
      this.set('isCollapsed', false);
    }
  }

  @computed('group.disabled')
  get ariaDisabled() {
    if (this.group.disabled) {
      return 'true';
    }
    return undefined;
  }

  @bool('select.searchText') isSearchActive;

  @reads('isSearchActive') allGroupsOpened;

  @computed('isCollapsed', 'allGroupsOpened')
  get collapseClass() {
    return (!this.isCollapsed || this.allGroupsOpened) ? 'group-opened' : '';
  }

  /** @override */
  didInsertElement() {
    this.element.addEventListener('click', () => {
      if (!this.isSearchActive) {
        this.toggleProperty('isCollapsed');
      }
    });
  }
}
