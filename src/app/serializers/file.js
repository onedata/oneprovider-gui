/**
 * Creates/reads graph relations based on entity ids from file data
 *
 * @author Jakub Liput
 * @copyright (C) 2020-2022 ACK CYFRONET AGH
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
import { aspect as archiveRecallInfoAspect } from 'oneprovider-gui/models/archive-recall-info';
import { aspect as archiveRecallStateAspect } from 'oneprovider-gui/models/archive-recall-state';
import _ from 'lodash';
import FileModel from 'oneprovider-gui/models/file';

export const qosSummaryAspect = 'qos_summary';
export const datasetSummaryAspect = 'dataset_summary';
export const storageLocationInfoAspect = 'storage_locations';

/**
 * Specifies runtime-created relations that base only on file ID, so can be created
 * without any other relation ID, and backend can save data not sending their exact
 * GRIs.
 */
export const fileRelations = Object.freeze([
  { name: 'acl', aspect: 'acl' },
  { name: 'distribution', aspect: 'distribution' },
  { name: 'fileQosSummary', aspect: qosSummaryAspect },
  { name: 'fileDatasetSummary', aspect: datasetSummaryAspect },
  { name: 'storageLocationInfo', aspect: storageLocationInfoAspect },
  // NOTE: currently archiveRecallRootFileId should be already set when doing ls++
  // to create valid relations; if this cointraint will to be changed,
  // a re-implementation will be needed
  {
    name: 'archiveRecallInfo',
    idSource: 'archiveRecallRootFileId',
    aspect: archiveRecallInfoAspect,
  },
  {
    name: 'archiveRecallState',
    idSource: 'archiveRecallRootFileId',
    aspect: archiveRecallStateAspect,
  },
]);

export default Serializer.extend({
  fileRelations,

  /**
   * Keys of this objects are keys in hash to be converted.
   * Every attr normalizer takes an attribute value and returns [targetKey, value] pair.
   * For example it will convert `parentFileId` key of hash to `parent`.
   */
  attrNormalizers: computed(function attrNormalizers() {
    return {
      [belongsToPropertyToRawAttribute('parent')]: (attribute, scope) => [
        'parent',
        attribute && gri({
          entityType: fileEntityType,
          entityId: attribute,
          aspect: 'instance',
          scope,
        }),
      ],
      [belongsToPropertyToRawAttribute('owner')]: (attribute) => [
        'owner',
        attribute === '0' ? null : gri({
          entityType: userEntityType,
          entityId: attribute,
          aspect: 'instance',
          scope: 'shared',
        }),
      ],
      [belongsToPropertyToRawAttribute('provider')]: (attribute) => [
        'provider',
        attribute && gri({
          entityType: providerEntityType,
          entityId: attribute,
          aspect: 'instance',
          scope: 'protected',
        }),
      ],
      [hasManyPropertyToRawAttribute('shareRecords')]: (attribute, scope) => [
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
   * For example it will convert `parent` key of hash to `parentFileId`.
   */
  attrSerializers: computed(function attrSerializers() {
    return ({
      parent: this.createEntityIdSerializer(
        belongsToPropertyToRawAttribute('parent')
      ),
      owner: this.createEntityIdSerializer(
        belongsToPropertyToRawAttribute('owner')
      ),
      provider: this.createEntityIdSerializer(
        belongsToPropertyToRawAttribute('provider')
      ),
      shareRecords: (attribute) => [
        hasManyPropertyToRawAttribute('shareRecords'),
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
    this.convertForeignKeys(hash, this.attrNormalizers, scope);
  },

  serializeRelations(hash, scope) {
    this.convertForeignKeys(hash, this.attrSerializers, scope);
  },

  serializeVirtualRelations(hash) {
    this.fileRelations.forEach(({ name }) => {
      delete hash[name];
    });
  },

  normalizeVirtualRelations(hash, fileId, scope) {
    this.fileRelations.forEach(({ name, idSource, entityType, aspect }) => {
      const entityId = idSource ? hash[idSource] : fileId;
      hash[name] = entityId ?
        this.getRelation({ entityType, entityId, aspect, scope }) : null;
    });
  },

  createEntityIdSerializer(name) {
    return (attribute) => [name, attribute && parseGri(attribute).entityId];
  },

  serializeData(recordGri, hash) {
    if (recordGri) {
      // this is record update
      const { entityId, scope } = parseGri(recordGri);
      hash.fileId = entityId;
      this.serializeRelations(hash, scope);
      this.serializeVirtualRelations(hash);
    }
    return hash;
  },

  normalizeData(hash) {
    if (!hash.gri) {
      // NOTE: The mock is broken, because it does not include guid and scope properties.
      // "gri" could be replaced here by "id", but virtual relations still does not work
      // properly - in mock, please use setting these relations manually or try to fix it.
      hash.gri = getFileGri(hash.fileId, hash.scope);
    }
    const parsedGri = parseGri(hash.gri);
    const scope = hash.scope || parsedGri.scope;
    const entityId = parsedGri.entityId;
    hash.sharesCount = hash.directShareIds?.length ?? 0;
    const xattrs = {};
    for (const property in hash) {
      if (property.startsWith('xattr.')) {
        xattrs[property.replace('xattr.', '')] = hash[property];
        delete hash[property];
      }
    }
    hash.xattrs = xattrs;
    this.normalizeRelations(hash, scope);
    this.normalizeVirtualRelations(hash, entityId, scope);
    return hash;
  },

  getRelation({
    entityId,
    aspect,
    entityType = fileEntityType,
    scope = 'private',
  }) {
    return gri({
      entityType,
      entityId,
      aspect,
      scope,
    });
  },
});

/**
 * @param {FileModel.Property} propertyName
 * @returns {FileModel.RawAttribute}
 */
export function belongsToPropertyToRawAttribute(propertyName) {
  switch (propertyName) {
    case 'parent':
      return 'parentFileId';
    case 'provider':
      return 'originProviderId';
    case 'owner':
      return 'ownerUserId';
    default:
      return `${propertyName}Id`;
  }
}

/**
 * @param {FileModel.Property} propertyName
 * @returns {FileModel.RawAttribute}
 */
export function hasManyPropertyToRawAttribute(propertyName) {
  switch (propertyName) {
    case 'shareRecords':
      return 'directShareIds';
    default:
      return propertyName;
  }
}

/**
 * @param {FileModel.RawAttribute} attributeName
 * @returns {FileModel.Property}
 */
export function rawAttributeToBelongsToProperty(attributeName) {
  switch (attributeName) {
    case 'parentFileId':
      return 'parent';
    case 'originProviderId':
      return 'provider';
    case 'ownerUserId':
      return 'owner';
    default:
      return _.trimEnd(attributeName, 'Id');
  }
}

/**
 * Set of relations that are created in serializer, so they should not be pushed into
 * store as a data.
 * @type {Set}
 */
const fileIdRelationNameSet = new Set(fileRelations.map(relationSpec =>
  relationSpec.name
));
const belongsToIdAttrSet = new Set();
FileModel.eachRelationship((propertyName, relationshipDefinition) => {
  if (
    relationshipDefinition.kind === 'belongsTo' &&
    !fileIdRelationNameSet.has(propertyName)
  ) {
    const rawAttributeName = belongsToPropertyToRawAttribute(propertyName);
    belongsToIdAttrSet.add(rawAttributeName);
  }
});

/**
 * @param {FileModel.RawAttribute} attributeName
 * @returns {FileModel.Property}
 */
export function rawAttributeToHasManyProperty(attributeName) {
  switch (attributeName) {
    case 'directShareIds':
      return 'shareRecords';
    default:
      return attributeName;
  }
}

export function isBelongsToProperty(propertyName) {
  return belongsToIdAttrSet.has(propertyName);
}

export function isHasManyProperty(propertyName) {
  return propertyName === 'shareRecords';
}

export function serializeBelongsToProperty(record, targetAttrName) {
  const propertyName = rawAttributeToBelongsToProperty(targetAttrName);
  return record.relationEntityId(propertyName);
}

export function serializeHasManyProperty(record, targetAttrName) {
  const propertyName = rawAttributeToHasManyProperty(targetAttrName);
  return record.hasMany(propertyName).ids().map(gri => parseGri(gri).entityId);
}
