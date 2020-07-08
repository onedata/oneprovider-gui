import Component from '@ember/component';
import { resolve } from 'rsvp';

export default Component.extend({
  actions: {
    updateXml(xml) {
      console.log(xml);
    },
    submit(xml) {
      console.log(xml);
      return resolve();
    },
  },
});
