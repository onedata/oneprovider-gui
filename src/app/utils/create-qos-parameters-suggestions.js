/**
 * Convert object with availiable QoS parameters for space to array of available QoS
 * parameters objects..
 *
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import QosParameterSuggestion from 'oneprovider-gui/utils/qos-parameter-suggestion';

function sortNumbers(a, b) {
  return a - b;
}

export default function createQosParametersSuggestions(availableQosParameters) {
  const suggestions = [];
  for (const key in availableQosParameters) {
    const { stringValues, numberValues } = availableQosParameters[key];
    const suggestion = QosParameterSuggestion.create({
      key,
      stringValues: [...stringValues].sort(),
      numberValues: [...numberValues].sort(sortNumbers),
    });
    suggestions.push(suggestion);
  }
  return suggestions.sortBy('key');
}
