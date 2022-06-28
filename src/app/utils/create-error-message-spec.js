/**
 * Simplifies raw error object from backend to message object that is used
 * in audit-log views.
 *
 * @author Jakub Liput
 * @copyright (C) 2022 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

/**
 * Error in recall process parsed for showing a simple info for user.
 * @typedef {Object} ErrorMessageSpec
 * @property {ErrorMessageSpecType} type
 * @property {string} [message]
 */

/**
 * Types:
 * - `message` - error is known and we have it translated
 * - `raw` - error could not be parsed as known error, the message will contain
 *           a formatted raw JSON
 * - `unknown` - there is not information about error, message will be empty
 * @typedef {'message'|'raw'|'unknown'} ErrorMessageSpecType
 */

/**
 * @param {RecallError} error
 * @param {Services.ErrorExtractor} errorExtractor
 * @returns {ErrorMessageSpec}
 */
export default function createErrorMessageSpec(error, errorExtractor) {
  if (error) {
    const messageObject = errorExtractor.getMessage(error);
    if (messageObject && messageObject.message) {
      return { type: 'message', message: String(messageObject.message) };
    } else {
      return { type: 'raw', message: JSON.stringify(error, null, 2) };
    }
  }
  return { type: 'unknown' };
}
