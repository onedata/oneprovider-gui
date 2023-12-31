/**
 * Reduce directional graph data to create bidirectional array of pairs.
 * Originally implemented for Oneprovider active channels manipulation
 *
 * @author Jakub Liput, Michał Borzęcki
 * @copyright (C) 2017-2018 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import _ from 'lodash';

/**
 * Generates collection of connection between two providers
 * Order in connection is random; each pair can occur once.
 * @param {object} mapping object with fields:
 * sourceProviderId -> [destinationProviderId]
 * @returns {Array<Array>} each array element has 2 elements, eg.
 *    `[['a', 'b'], ['c', 'a'], ['b', 'c']]`
 */
export default function bidirectionalPairs(mapping) {
  return _(Object.keys(mapping))
    .flatMap(sourceId => mapping[sourceId].map(destId => [sourceId, destId].sort()))
    .uniqWith((a, b) => _.isEqual(a, b))
    .value();
}
