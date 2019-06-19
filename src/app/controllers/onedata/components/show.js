import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  originInfo: computed(function originInfo() {
    return `Cluster ID: ${/https:\/\/.*?\/opw\/(.*?)\/.*/.exec(location.href)[1]
      }`;
  }),
});
