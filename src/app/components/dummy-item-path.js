import Component from '@ember/component';
import { collect } from 'ember-awesome-macros';
import { inject as service } from '@ember/service';
import { reads, equal } from '@ember/object/computed';
import { get, set } from '@ember/object';

export default Component.extend({
  mockBackend: service(),

  item: reads('mockBackend.entityRecords.chainDir.3'),
});
