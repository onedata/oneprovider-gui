import Route from '@ember/routing/route';

export default Route.extend({
  model({ component_id }) {
    return {
      componentId: component_id,
    };
  },
});
