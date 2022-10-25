import Component from '@ember/component';

export default Component.extend({
  tagName: 'span',
  classNames: ['tab-bar-li', 'clickable'],
  classNameBindings: ['isActive:active', 'disabled'],
});
