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
import { entityType as shareEntityType } from 'oneprovider-gui/models/share';
import { get, computed } from '@ember/object';
import { getFileGri } from 'oneprovider-gui/models/file';
import _ from 'lodash';
import config from 'ember-get-config';
import { isDevelopment } from 'onedata-gui-websocket-client/utils/development-environment';

const isUsingMock = isDevelopment(config);

const normalizedFileTypes = {
  REG: 'file',
  DIR: 'dir',
  LNK: 'hardlink',
  SYMLNK: 'symlink',
};
const defaultNormalizedFileType = 'file';

const serializedFileTypes = _.invert(normalizedFileTypes);

export default Serializer.extend({
  fileRelations: computed(() => [
    { name: 'acl', aspect: 'acl' },
    { name: 'distribution', aspect: 'distribution' },
    { name: 'fileQosSummary', aspect: 'file_qos_summary' },
  ]),

  /**
   * Keys of this objects are keys in hash to be converted.
   * Every attr normalizer takes an attribute value and returns [targetKey, value] pair.
   * For example it will convert `parentId` key of hash to `parent`.
   */
  attrNormalizers: computed(function attrNormalizers() {
    return {
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
      shares: (attribute, scope) => [
        'shareRecords',
        attribute && attribute.map(id => gri({
          entityType: shareEntityType,
          entityId: id,
          aspect: 'instance',
          scope,
        })),
      ],
    };
  }),

  /**
   * Keys of this objects are keys in hash to be converted.
   * Every attr serializer takes an attribute value and returns [targetKey, value] pair.
   * For example it will convert `parent` key of hash to `parentId`.
   */
  attrSerializers: computed(function attrSerializers() {
    return ({
      parent: this.createEntityIdSerializer('parentId'),
      owner: this.createEntityIdSerializer('ownerId'),
      provider: this.createEntityIdSerializer('providerId'),
      shareRecords: (attribute) => [
        'shares',
        attribute && attribute.map(gri => parseGri(gri).entityId),
      ],
    });
  }),

  /**
   * @override
   */
  normalize(typeClass, hash) {
    this.normalizeData(hash);
    return this._super(typeClass, hash);
  },

  /**
   * @override
   */
  serialize(snapshot) {
    const hash = this._super(...arguments);
    const id = get(snapshot, 'id');
    this.serializeData(id, hash);
    return hash;
  },

  convertForeignKeys(hash, converters, scope) {
    for (const key in hash) {
      const converter = converters[key];
      if (converter) {
        const [newKey, newAttribute] = converter(hash[key], scope);
        hash[newKey] = newAttribute;
        delete hash[key];
      }
    }
  },

  normalizeRelations(hash, scope) {
    this.convertForeignKeys(hash, this.get('attrNormalizers'), scope);
  },

  serializeRelations(hash, scope) {
    this.convertForeignKeys(hash, this.get('attrSerializers'), scope);
  },

  serializeVirtualRelations(hash) {
    this.get('fileRelations').forEach(({ name }) => {
      delete hash[name];
    });
  },

  normalizeVirtualRelations(hash, fileId, scope) {
    this.get('fileRelations').forEach(({ name, entityType, aspect }) => {
      hash[name] = this.getRelation({ fileId, entityType, aspect, scope });
    });
  },

  createEntityIdSerializer(name) {
    return (attribute) => [name, attribute && parseGri(attribute).entityId];
  },

  serializeData(recordGri, hash) {
    if (recordGri) {
      // this is record update
      const { entityId, scope } = parseGri(recordGri);
      hash.guid = entityId;
      this.serializeRelations(hash, scope);
      this.serializeVirtualRelations(hash);
    }
    if (isUsingMock) {
      hash.data.attributes.type = serializedFileTypes[hash.data.attributes.type];
    } else {
      hash.type = serializedFileTypes[hash.type];
    }
    return hash;
  },

  normalizeData(hash) {
    if (!hash.gri) {
      hash.gri = getFileGri(hash.guid, hash.scope);
    }
    const parsedGri = parseGri(hash.gri);
    const scope = hash.scope || parsedGri.scope;
    const entityId = parsedGri.entityId;
    if (isUsingMock) {
      hash.attributes.type =
        normalizedFileTypes[hash.attributes.type] || defaultNormalizedFileType;
    } else {
      hash.type = normalizedFileTypes[hash.type] || defaultNormalizedFileType;
    }
    hash.sharesCount = hash.shares ? hash.shares.length : 0;
    this.normalizeRelations(hash, scope);
    this.normalizeVirtualRelations(hash, entityId, scope);
    return hash;
  },

  getRelation({
    fileId,
    aspect,
    entityType = fileEntityType,
    scope = 'private',
  }) {
    return gri({
      entityType,
      entityId: fileId,
      aspect,
      scope,
    });
  },
});
