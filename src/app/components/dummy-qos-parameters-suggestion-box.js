/**
 * Demo of qos-parameters-suggestion-box
 * 
 * @module components/dummy-qos-parameters-suggestion-box
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Component from '@ember/component';
import createQosParametersSuggestions from 'oneprovider-gui/utils/create-qos-parameters-suggestions';

export default Component.extend({
  textareaValue: '',

  init() {
    this._super(...arguments);

    const availableQosParameters = {
      storageId: {
        stringValues: ['storage_id_zeta', 'storage_id_alpha'],
        numberValues: [],
      },
      storageType: {
        stringValues: ['posix', 'cephrados', 'webdav'],
        numberValues: [],
      },
      myCustomParameter: {
        stringValues: ['one', 'two'],
        numberValues: [10, 23, 36],
      },
      priority: {
        stringValues: [],
        numberValues: [1, 2],
      },
    };

    const qosParametersSuggestions =
      createQosParametersSuggestions(availableQosParameters);

    this.set('qosParametersSuggestions', qosParametersSuggestions);
  },

  actions: {
    insertString(text) {
      this.set('textareaValue', this.get('textareaValue') + text);
    },
  },
});
