import Component from '@ember/component';
import { operatorChar } from 'oneprovider-gui/utils/qos-rpn-to-object';
import { notEqual, equal, raw } from 'ember-awesome-macros';

export default Component.extend({
  tagName: '',

  data: undefined,

  operatorString: operatorChar['not'],

  brackets: notEqual('data.a.type', raw('pair')),
});
