/**
 * Convert object with availiable QoS parameters for space to array of available QoS
 * parameters objects ready to use in `qos-parameters-suggestions-box`.
 * 
 * @module utils/create-qos-parameters-suggestions
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import QosParameterSuggestion from 'oneprovider-gui/utils/qos-parameter-suggestion';

export default function createQosParametersSuggestions(availableQosParameters) {
  const suggestions = [];
  for (const key in availableQosParameters) {
    const { stringValues, numberValues } = availableQosParameters[key];
    suggestions.push(QosParameterSuggestion.create({
      key,
      stringValues: [...stringValues].sort(),
      numberValues: [...numberValues].sort(),
    }));
  }
  return suggestions.sortBy('key');
}
