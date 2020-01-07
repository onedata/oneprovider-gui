/**
 * Invoke multiple files operations and then show message if there were at least
 * one error.
 * 
 * @module utils/handle-multi-files-operation
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import _ from 'lodash';
import { resolve, hashSettled } from 'rsvp';
import { get } from '@ember/object';

/**
 * Invoke async function `operation` on each file in `files`.
 * Wait for all results and return hash with results (as in RSVP Promise lib).
 * @param {Array<models/File>} opts.files
 * @param {Object} opts.operationOptions
 * @param {Function} operation `(file, operationOptions) => Promise`
 * @returns {Object}
 */
export function wrapOperations({ files, operationOptions }, operation) {
  if (get(files, 'length') === 0) {
    return resolve();
  } else {
    return hashSettled(_.zipObject(files.mapBy('entityId'), files.map(file =>
      operation(file, operationOptions)
    )));
  }
}

/**
 * Looks what are the results of `RSVP.hash` with file operations and constructs
 * object with summary used in other functions.
 * @param {Object} promisesHash `RSVP.hash` result, eg. from `wrapOperations`
 * @returns {Object} preprocessed information about multi files operation results
 *   used by other functions
 */
export function interpretPromises(promisesHash) {
  const rejected = [];
  for (const key in promisesHash) {
    const value = promisesHash[key];
    if (get(value, 'state') === 'rejected') {
      rejected.push({
        file: key,
        reason: get(value, 'reason'),
      });
    }
  }
  let failQuantity;
  const failedCount = get(rejected, 'length');
  if (failedCount > 0) {
    if (failedCount === 1) {
      failQuantity = 'single';
    } else if (failedCount === Object.keys(promisesHash).length) {
      failQuantity = 'all';
    } else {
      failQuantity = 'multi';
    }
  } else {
    failQuantity = 'none';
  }

  return { failQuantity, rejected };
}

/**
 * Using result of `interpretPromises`, informs user about errors if needed.
 * @returns {undefined}
 */
export function notifyBatchError({
  promisesInterpretation,
  globalNotify,
  errorExtractor,
  i18n,
  operationErrorKey,
}) {
  const {
    failQuantity,
    rejected,
  } = promisesInterpretation;
  const firstRejectedReason = rejected[0] && get(rejected[0], 'reason');
  globalNotify.backendError(
    i18n.t(operationErrorKey),
    i18n.t('utils.handleMultiFilesOperation.multiFilesError.' + failQuantity, {
      reason: firstRejectedReason && get(
        errorExtractor.getMessage(firstRejectedReason),
        'message'
      ),
      moreCount: get(rejected, 'length') - 1,
    })
  );
}

/**
 * Invoke async function `operation` on each file in `files` and if there were
 * errors, inform user about it.
 * @param {Array<models/File>} opts.files
 * @param {Ember.Service} opts.globalNotify
 * @param {Ember.Service} opts.errorExtractor
 * @param {Ember.Service} opts.i18n
 * @param {Object} [opts.operationOptions] optional second argument for `operation`
 * @param {Object} opts.operationErrorKey i18n error key for `backendError`
 * @param {Function} operation `(file, operationOptions) => Promise`
 * @returns {Promise}
 */
export default function handleMultiFilesOperation({
    files,
    globalNotify,
    errorExtractor,
    i18n,
    operationOptions = {},
    operationErrorKey,
  },
  operation
) {
  return wrapOperations({ files, operationOptions }, operation)
    .then(promisesHash => {
      const promisesInterpretation = interpretPromises(promisesHash);
      if (get(promisesInterpretation, 'failQuantity') !== 'none') {
        notifyBatchError({
          promisesInterpretation,
          operationErrorKey,
          globalNotify,
          errorExtractor,
          i18n,
        });
      }
      return promisesHash;
    });
}
