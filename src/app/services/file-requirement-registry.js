import Service from '@ember/service';
import FileRequirement, {
  possibleFileRawAttributesSet,
} from 'oneprovider-gui/utils/file-requirement';
import _ from 'lodash';
import { computed } from '@ember/object';

/**
 * A GUI entity (might be a component, service, anything that is "living" during runtime)
 * that uses file with some required properties. As long, as the Consumer lives, it should
 * be registered in the FileRequirementRegistry with its requirements.
 *
 * For example, a file shares information panel component would need a file: `name`,
 * `sharesCount` and `sharesRecords` properties. This need (a FileRequirement)
 * is registered in global registry as a pair with the Consumer, and any method fetching
 * file data should ask the registry for the needed properties set as long as there are
 * Consumers that needs these properties.
 * @typedef {any} FileConsumer
 */

/**
 * @type {Object<File.Property, File.RawAttribute|Array<File.RawAttribute>}
 */
const propertiesToAttrsMapping = Object.freeze({
  // FIXME: sprawdzić czy to jest na pewno dostępne w atrybutach z backendu
  // sharesCount,
  // conflictingName,
  // targetPath,

  // FIXME: artificial relation properties that are created in serializer - być może usunąć
  // 'acl',
  // 'distribution',
  // 'storageLocationInfo',
  // 'fileQosSummary',
  // 'fileDatasetSummary',
  // 'archiveRecallInfo',
  // 'archiveRecallState',

  // Attributes normalized by serializer to create ember-data relations.
  shareRecords: 'shares',
  parent: 'parentId',
  owner: 'ownerId',
  provider: 'providerId',
  archive: 'archiveId',

  originalName: ['conflictingName', 'name'],
  effFile: ['type', 'symlinkTargetFile'],
  dataIsProtected: 'effProtectionFlags',
  metadataIsProtected: 'effProtectionFlags',
  dataIsProtectedByDataset: 'effDatasetProtectionFlags',
  metadataIsProtectedByDataset: 'effDatasetProtectionFlags',
  isShared: 'sharesCount',
  cdmiObjectId: 'entityId',
  hasParent: 'parentId',
  isArchiveRootDir: 'archiveId',
  spaceEntityId: 'fileId',
  internalFileId: 'fileId',
  recallingMembership: 'recallRootId',
  isRecalling: 'recallRootId',
  isRecalled: 'recallRootId',
});

export default Service.extend({
  //#region configuration

  // FIXME: maybe add more, maybe remove type...
  basicProperties: Object.freeze([
    'guid',
    'name',
    'type',
  ]),

  //#endregion

  //#region state

  /**
   * @type {Map<FileConsumer, Array<Utils.FileRequirement>}
   */
  consumerRequirementsMap: undefined,

  //#endregion

  /**
   * @type {ComputedProperty<Utils.FileRequirement>}
   */
  basicRequirement: computed('basicProperties', function basicRequirement() {
    return FileRequirement.create({
      properties: this.basicProperties,
    });
  }),

  init() {
    this._super(...arguments);
    this.set('consumerRequirementsMap', new Map());
  },

  /**
   * @param {Utils.FileQuery} query
   * @returns {Array<File.RawAttribute>}
   */
  findAttrsRequirement(query) {
    const matchingRequirements = this.getRequirements().filter(requirement =>
      query.matches(requirement)
    );
    matchingRequirements.push(this.basicRequirement);
    const requiredProperties = _.uniq(_.flatten(
      matchingRequirements.map(requirement => requirement.properties)
    ));
    return this.propertiesToAttrs(requiredProperties);
  },

  /**
   * @param {FileConsumer} consumer
   * @param {Array<Utils.FileRequirement>|Utils.FileRequirement} requirements
   */
  setRequirements(consumer, requirements) {
    const reqArray = Array.isArray(requirements) ? requirements : [requirements];
    this.consumerRequirementsMap.set(consumer, reqArray);
  },

  /**
   * @param {FileConsumer} consumer
   */
  removeRequirements(consumer) {
    this.consumerRequirementsMap.delete(consumer);
  },

  getRequirements() {
    return _.flatten([...this.consumerRequirementsMap.values()]);
  },

  /**
   * @param {Array<File.Property>} properties
   * @returns {Array<File.RawAttribute>}
   */
  propertiesToAttrs(properties) {
    /** @type {Array<File.RawAttribute>} */
    const attributes = [];
    for (const property of properties) {
      // By default, the name of attribute is the same as property. If there is no such
      // attribute, it means that it could be an artificial property that was
      // created in file serializer, that does not need an attribute.
      const attr = propertiesToAttrsMapping[property] ??
        (possibleFileRawAttributesSet.has(property) ? property : null);
      if (attr) {
        if (Array.isArray(attr)) {
          attributes.push(...attr);
        } else {
          attributes.push(attr);
        }
      }
    }
    return _.uniq(attributes);
  },
});
