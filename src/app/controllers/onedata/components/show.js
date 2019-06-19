import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  originInfo: computed(function originInfo() {
    const m = /https:\/\/.*?\/opw\/(.*?)\/.*/.exec(location.href);
    return m && `Cluster ID: ${m[1]}`;
  }),
});
