import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  constraintSpec: undefined,

  actions: {
    submit(selectedItems) {
      this.get('onSubmit')(selectedItems);
    },
  },
});
