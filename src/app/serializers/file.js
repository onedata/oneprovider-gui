/**
 * Creates/reads graph relations based on entity ids from file data
 *
 * @module serializers/file
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
import { entityType as archiveEntityType } from 'oneprovider-gui/models/archive';
import { get, computed } from '@ember/object';
import { getFileGri } from 'oneprovider-gui/models/file';
import { aspect as archiveRecallInfoAspect } from 'oneprovider-gui/models/archive-recall-info';
import { aspect as archiveRecallStateAspect } from 'oneprovider-gui/models/archive-recall-state';

export const qosSummaryAspect = 'qos_summary';
export const datasetSummaryAspect = 'dataset_summary';
export const storageLocationsAspect = 'storage_locations';

export default Serializer.extend({
  fileRelations: computed(() => [
    { name: 'acl', aspect: 'acl' },
    { name: 'distribution', aspect: 'distribution' },
    { name: 'fileQosSummary', aspect: qosSummaryAspect },
    { name: 'fileDatasetSummary', aspect: datasetSummaryAspect },
    { name: 'storageLocations', aspect: storageLocationsAspect},
    // NOTE: currently recallRootId should be already set when doing ls++
    // to create valid relations; if this cointraint will to be changed,
    // a re-implementation will be needed
    {
      name: 'archiveRecallInfo',
      idSource: 'recallRootId',
      aspect: archiveRecallInfoAspect,
    },
    {
      name: 'archiveRecallState',
      idSource: 'recallRootId',
      aspect: archiveRecallStateAspect,
    },
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
      archiveId: (attribute, scope) => [
        'archive',
        attribute && gri({
          entityType: archiveEntityType,
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
    this.get('fileRelations').forEach(({ name, idSource, entityType, aspect }) => {
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
      hash.guid = entityId;
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
      hash.gri = getFileGri(hash.guid, hash.scope);
    }
    const parsedGri = parseGri(hash.gri);
    const scope = hash.scope || parsedGri.scope;
    const entityId = parsedGri.entityId;
    hash.sharesCount = hash.shares ? hash.shares.length : 0;
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
