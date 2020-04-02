import Component from '@ember/component';

export default Component.extend({
  expression: Object.freeze(['a=b', 'c=d', '|', '-', 'x=y', '&', 'z=v', '|']),
});
