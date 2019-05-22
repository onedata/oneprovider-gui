import Route from '@ember/routing/route';

export default Route.extend({
  model({ component_id }) {
    // if (window.frameElement) {
    //   window.frameElement.onedataUpdateData = ;
    // }
    return {
      componentId: component_id,
      data: window.frameElement && window.frameElement.onedataData,
      actions: window.frameElement && window.frameElement.onedataActions,
    };
  },
});
