import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  scrollState: service(),

  originInfo: computed(function originInfo() {
    const m = /https:\/\/.*?\/opw\/(.*?)\/.*/.exec(location.href);
    return m && `Cluster ID: ${m[1]}`;
  }),

  actions: {
    scrollOccurred(scrollEvent) {
      this.get('scrollState').scrollOccurred(scrollEvent);
    },
  },
});
