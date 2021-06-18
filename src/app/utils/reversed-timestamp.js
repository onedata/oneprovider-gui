/**
 * Returns timestamp calculated backwards since backend "epoch infinity".
 *
 * @module utils/reversed-timestamp
 * @author Michał Borzęcki
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

const backendEpochInfinity = 9999999999;

/**
 * @param {Number} timestamp
 * @returns {Number}
 */
export default function reversedTimestamp(timestamp) {
  return backendEpochInfinity - timestamp;
}
