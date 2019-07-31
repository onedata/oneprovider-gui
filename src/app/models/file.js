/**
 * Single file or directory model.
 * 
 * @module models/file
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { alias } from '@ember/object/computed';
import { belongsTo } from 'onedata-gui-websocket-client/utils/relationships';
import { computed } from '@ember/object';

import GraphSingleModelMixin from 'onedata-gui-websocket-client/mixins/models/graph-single-model';

export default Model.extend(GraphSingleModelMixin, {
  name: attr('string'),
  index: attr('string'),
  type: attr('string'),
  size: attr('number'),
  parent: belongsTo('file'),

  /**
   * Modification time in UNIX timestamp format.
   */
  mtime: attr('number'),

  modificationTime: alias('mtime'),

  hasParent: computed(function hasParent() {
    return Boolean(this.belongsTo('parent').id());
  }),
});
