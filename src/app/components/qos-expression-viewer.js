import Component from '@ember/component';
import qosRpnToObject from 'oneprovider-gui/utils/qos-rpn-to-object';
import computedPipe from 'onedata-gui-common/utils/ember/computed-pipe';

export default Component.extend({
  expression: undefined,

  data: computedPipe('expression', qosRpnToObject),
});
