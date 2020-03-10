/**
 * Creates/reads graph relations based on entity ids from file data
 *
 * @module serializers/file
 * @author Jakub Liput
 * @copyright (C) 2020 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Serializer from 'onedata-gui-websocket-client/serializers/application';
import gri from 'onedata-gui-websocket-client/utils/gri';
import parseGri from 'onedata-gui-websocket-client/utils/parse-gri';
import { entityType as fileEntityType } from 'oneprovider-gui/models/file';
import { entityType as providerEntityType } from 'oneprovider-gui/models/provider';
import { entityType as userEntityType } from 'oneprovider-gui/models/user';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';

const fileRelations = ['acl', 'distribution'];

export const attrNormalizers = {
  parentId: (attribute, scope) => [
    'parent',
    attribute && gri({
      entityType: fileEntityType,
      entityId: attribute,
      aspect: 'instance',
      scope,
    }),
  ],
  ownerId: (attribute, scope) => [
    'owner',
    attribute === '0' ? null : gri({
      entityType: userEntityType,
      entityId: attribute,
      aspect: 'instance',
      scope,
    }),
  ],
  providerId: (attribute, scope) => [
    'provider',
    attribute && gri({
      entityType: providerEntityType,
      entityId: attribute,
      aspect: 'instance',
      scope,
    }),
  ],
};

export const attrSerializers = {
  parent: (attribute) => [
    'parentId',
    attribute && parseGri(attribute).entityId,
  ],
  owner: (attribute) => [
    'ownerId',
    attribute && parseGri(attribute).entityId,
  ],
  provider: (attribute) => [
    'providerId',
    attribute && parseGri(attribute).entityId,
  ],
};

export function getRelation(fileId, aspect, scope = 'private') {
  return gri({
    entityType: fileEntityType,
    entityId: fileId,
    aspect,
    scope,
  });
}

export function convertForeignKeys(hash, converters, scope) {
  for (const key in hash) {
    const converter = converters[key];
    if (converter) {
      const [newKey, newAttribute] = converter(hash[key], scope);
      hash[newKey] = newAttribute;
      delete hash[key];
    }
  }
}

export default Serializer.extend({
  fileManager: service(),

  normalize(typeClass, hash) {
    const fileManager = this.get('fileManager');
    if (!hash.gri) {
      hash.gri = fileManager.getFileGri(hash.guid, hash.scope);
    }
    const parsedGri = parseGri(hash.gri);
    const scope = hash.scope || parsedGri.scope;
    const entityId = parsedGri.entityId;
    normalizeRelations(hash, scope);
    normalizeVirtualRelations(hash, entityId, scope);
    return this._super(typeClass, hash);
  },

  serialize(snapshot) {
    const recordGri = get(snapshot, 'id');
    const hash = this._super(...arguments);
    if (recordGri) {
      // this is record update
      const { entityId, scope } = parseGri(recordGri);
      hash.guid = entityId;
      serializeRelations(hash, scope);
      serializeVirtualRelations(hash);
    }
    return hash;
  },
});

function normalizeRelations(hash, scope) {
  convertForeignKeys(hash, attrNormalizers, scope);
}

function serializeRelations(hash, scope) {
  convertForeignKeys(hash, attrSerializers, scope);
}

function serializeVirtualRelations(hash) {
  fileRelations.forEach(name => {
    delete hash[name];
  });
}

function normalizeVirtualRelations(hash, entityId, scope) {
  fileRelations.forEach(name => {
    hash[name] = getRelation(entityId, name, scope);
  });
}
