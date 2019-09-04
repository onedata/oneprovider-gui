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

export function wrapOperations({ files, operationOptions }, operation) {
  if (get(files, 'length') === 0) {
    return resolve();
  } else {
    return hashSettled(_.zipObject(files.mapBy('entityId'), files.map(file =>
      operation(file, operationOptions)
    )));
  }
}

export function interpretPromises(promisesHash) {
  const rejected = [];
  for (let key in promisesHash) {
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
    } else if (failedCount === get(promisesHash, 'length')) {
      failQuantity = 'all';
    } else {
      failQuantity = 'multi';
    }
  } else {
    failQuantity = 'none';
  }

  return { failQuantity, rejected };
}

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
