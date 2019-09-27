import Component from '@ember/component';
import config from 'ember-get-config';
import _ from 'lodash';

const {
  layoutConfig,
} = config;

export default Component.extend({
  classNames: ['fb-metadata-xattrs'],

  /**
   * Object with `xattr_key: xattr_value`
   */
  metadata: undefined,

  layoutConfig,

  areXattrsValid: true,

  actions: {
    xattrsChanged({ isValid, qosParams: xattrs }) {
      this.get('metadataChanged')({
        type: 'xattrs',
        isValid,
        metadata: _.cloneDeep(xattrs),
      });
    },
    disableEnterKey(keyEvent) {
      if (keyEvent.which === '13') {
        keyEvent.preventDefault();
      }
    },
  },
});
