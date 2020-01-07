/**
 * Invert function escaping performed by backend.
 * See `op-worker`: `src/modules/view/view_utils.erl`
 * 
 * @module utils/unescape-backend-function
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

export default function unescapeBackendFunction(functionString) {
  return functionString.replace(/\\(\\|"|'|n|t|v|f|0|r)/g, function (charString) {
    return charString[charString.length - 1];
  });
}
