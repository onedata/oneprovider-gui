/**
 * Stores requirements for file records data and offers querying for attributes
 * that should be fetched using file API basing on specified conditions.
 *
 * There are FileConsumers in the app - entities (eg. components) that use file record.
 * A FileConsumer uses a set of files and these files could need specific properties of
 * file model. As the file model have a large number of properties, the backend allows
 * to specify which attributes should be fetched when asking for the file data (or
 * multiple files data in case of fetching directory children). Each FileConsumer
 * should register a set of FileRequirements that specifies a condition saying which
 * backend requests are affected. Then the requirements are registered for the consumer
 * in this registry. When the consumer is destroyed, the requirements should be
 * deregistered, so the backend API calls will not take its requirements into account
 * anymore.
 *
 * See `Mixin.FileConsumer` documentation to implement the FileConsumer and use this
 * registry in a convenient way. The registry typically should not be used directly, but
 * by using `Mixin.FileConsumer`.
 *
 * @author Jakub Liput
 * @copyright (C) 2023 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import Service, { inject as service } from '@ember/service';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import {
  possibleFileRawAttributesSet,
  propertyToAttributesMap,
} from 'oneprovider-gui/utils/file-model';
import _ from 'lodash';
import { get, computed } from '@ember/object';
import { allSettled } from 'rsvp';
import includesAll from 'onedata-gui-common/utils/includes-all';

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
 * @typedef {Object} FileConsumer
 * @property {Array<Utils.FileRequirement>} fileRequirements
 * @property {Array<Models.File>} usedFiles
 */

export default Service.extend({
  fileRecordRegistry: service(),
  store: service(),

  //#region configuration

  /**
   * File properties that should be always available in file record.
   * @type {Array<FileModel.Property>}
   */
  basicProperties: Object.freeze([
    'conflictingName',
    'originalName',
    'effFile',
    'symlinkValue',
    'fileId',
    'hasParent',
    'name',
    'parent',
    'type',
  ]),

  //#endregion

  //#region state

  /**
   * @type {Map<FileConsumer, Array<Utils.FileRequirement>}
   */
  consumerRequirementsMap: undefined,

  /**
   * A cache mapping parent ID to set of all properties that are required by requirements
   * with `parentId` condition.
   * @type {Object<string, Map<FileModel.Property, number>>}
   */
  propertiesForParentId: undefined,

  /**
   * A cache mapping file GRI to set of all properties that are required by requirements
   * with `fileGri` condition.
   * @type {Object<string, Map<FileModel.Property, number>>}
   */
  propertiesForFileGri: undefined,

  //#endregion

  /**
   * @type {ComputedProperty<Utils.FileRequirement>}
   */
  basicRequirement: computed('basicProperties', function basicRequirement() {
    return new FileRequirement({
      properties: this.basicProperties,
    });
  }),

  init() {
    this._super(...arguments);
    this.set('consumerRequirementsMap', new Map());
    this.set('propertiesForParentId', {});
    this.set('propertiesForFileGri', {});
  },

  /**
   * Gets attributes required for the queries. Checks:
   * - exact query matching with requirement query (GRI-GRI, parent-parent),
   * - if the already loaded file matches some parent condition using GRI query,
   * - if the already loaded file matches some GRI condition using parent query.
   *
   * Uses all already loaded files from store to perform non-exact query matching.
   *
   * @public
   * @param {...Utils.FileQuery} queries
   * @returns {Array<File.RawAttribute>}
   */
  getRequiredAttributes(...queries) {
    const matchingRequirements = [];
    let remainRequirements = this.getRequirements();
    let allFiles;
    /**
     * Lazily get all store files - uses cache when invoked many times.
     * @returns {Array<Models.File>}
     */
    const getAllFiles = () => {
      if (!allFiles) {
        allFiles = this.store.peekAll('file');
      }
      return allFiles;
    };
    for (const query of queries) {
      let currentMatchingRequirements;
      const queryType = query.getQueryType();

      // Select requirements directly matching the query.
      [currentMatchingRequirements, remainRequirements] = _.partition(
        remainRequirements,
        (req) => req.matches(query)
      );
      matchingRequirements.push(...currentMatchingRequirements);
      if (!remainRequirements.length) {
        break;
      }

      if (queryType === 'fileGri') {
        // Select requirements for known files that have the parent matching
        const file = getAllFiles().find(file =>
          file && get(file, 'id') === query.fileGri
        );
        if (file) {
          [currentMatchingRequirements, remainRequirements] = _.partition(
            remainRequirements,
            (req) => {
              return req.getQueryType() === 'parentId' &&
                req.parentId === file.relationEntityId('parent');
            }
          );

          matchingRequirements.push(...currentMatchingRequirements);
        }
      }
    }
    const requiredProperties = _.uniq(_.flatten(
      matchingRequirements.map(requirement => requirement.properties)
    ));
    return this.propertiesToAttrs(requiredProperties);
  },

  /**
   * Sets FileRequirements for the FileConsumer.
   * If consumer already has requirements set then replace all requirements.
   * If there are files loaded already in store that will have its requirements extended
   * then reload these files. Extending requirements means, that there will be more
   * properties for file required after requirements set.
   * @public
   * @param {FileConsumer} consumer
   * @param {...Utils.FileRequirement} requirements
   * @returns {Promise<PromiseState<Models.File>>} Settled promise states of files that
   *   have been triggered to be reloaded.
   */
  async setRequirements(consumer, ...requirements) {
    const currentConsumerRequirements = this.consumerRequirementsMap.get(consumer);
    if (
      currentConsumerRequirements &&
      requirements &&
      requirements.length === currentConsumerRequirements.length &&
      _.isEqual([...currentConsumerRequirements].sort(), [...requirements].sort())
    ) {
      // optimize out setting the same requirements for consumer
      return;
    }

    const richRequirements = this.filterOutBasicRequirements(requirements);
    if (_.isEmpty(richRequirements)) {
      this.consumerRequirementsMap.delete(consumer);
      return;
    }
    const filesToUpdate = this.getFilesToUpdate(richRequirements);
    // TODO: VFS-11252 optimize invocation of updatePropertiesCache:
    // - make two sets: of completely new requirements and completely deleted
    // - updatePropertiesCache with false for deleted ones and with true for only new
    if (currentConsumerRequirements) {
      this.updatePropertiesCache(false, ...currentConsumerRequirements);
    }
    this.updatePropertiesCache(true, ...richRequirements);
    this.consumerRequirementsMap.set(consumer, richRequirements);
    return await allSettled(filesToUpdate.map(file => {
      return file.reload();
    }));
  },

  /**
   * @public
   * @param {FileConsumer} consumer
   * @returns {void}
   */
  deregisterRequirements(consumer) {
    const currentConsumerRequirements = this.consumerRequirementsMap.get(consumer);
    if (currentConsumerRequirements) {
      this.updatePropertiesCache(false, ...currentConsumerRequirements);
      this.consumerRequirementsMap.delete(consumer);
    }
  },

  /**
   * @returns Array<Utils.FileRequirement>
   */
  getRequirements() {
    return _.flatten([
      this.basicRequirement,
      ...this.consumerRequirementsMap.values(),
    ]);
  },

  /**
   * @private
   * @param {Array<FileRequirement>} requirements
   * @returns {Array<FileRequirement>}
   */
  filterOutBasicRequirements(requirements) {
    if (_.isEmpty(requirements)) {
      return [];
    }
    const basicProperties = this.basicProperties;
    return requirements.filter(requirement =>
      requirement.properties.some(requiredProperty =>
        !basicProperties.includes(requiredProperty)
      )
    );
  },

  /**
   * From the collection of `newRequirements` choose a sub-collection that brings new
   * required properties for files (not in the current registry - `currentRequirements`).
   * @private
   * @param {Array<FileRequirement>} newRequirements
   * @param {Array<FileRequirement>} [currentRequirements]
   * @returns {Set<FileRequirement>}
   */
  getAbsentRequirementSet(newRequirements, currentRequirements = this.getRequirements()) {
    if (!currentRequirements?.length) {
      return new Set(newRequirements);
    }
    const newReqsNewConditions =
      _.differenceWith(newRequirements, currentRequirements, (ra, rb) =>
        ra.conditionEquals(rb)
      );
    const newReqsOldConditions = _.difference(newRequirements, newReqsNewConditions);
    const currentRequirementsStringified =
      currentRequirements.map(req => req.toString());
    const oldConditionsWithNewProperties = newReqsOldConditions.filter(newReq => {
      // filter out identical requirements
      if (currentRequirementsStringified.includes(newReq.toString())) {
        return false;
      }
      // search for at least one property in new requirement that does not occur
      // in current requirements
      let equalConditionPropertiesMap;
      switch (newReq.getQueryType()) {
        case 'parentId':
          equalConditionPropertiesMap = this.propertiesForParentId[newReq.parentId];
          break;
        case 'fileGri':
          equalConditionPropertiesMap = this.propertiesForFileGri[newReq.fileGri];
          break;
        default: {
          const equalConditionCurrentReqs = currentRequirements.filter(currentReq =>
            currentReq.conditionEquals(newReq)
          );
          const equalConditionPropertiesSet = new Set(
            _.flatten(equalConditionCurrentReqs.map(req => req.properties))
          );
          for (const newProperty of newReq.properties) {
            if (!equalConditionPropertiesSet.has(newProperty)) {
              return true;
            }
          }
        }
        break;
      }
      if (equalConditionPropertiesMap) {
        for (const newProperty of newReq.properties) {
          if (!equalConditionPropertiesMap.get(newProperty)) {
            return true;
          }
        }
      }
      return false;
    });
    return new Set([...newReqsNewConditions, ...oldConditionsWithNewProperties]);
  },

  /**
   * For collection of requirements in `newRequiremets` get file records that
   * need a reload because new properties need to be loaded for them.
   * @private
   * @param {Array<FileRequirement>} newRequirements
   * @returns {Array<Models.File>}
   */
  getFilesToUpdate(newRequirements) {
    if (!newRequirements?.length) {
      return [];
    }
    const registeredFiles = this.fileRecordRegistry.getRegisteredFiles();
    const allRequirements = this.getRequirements();
    if (!allRequirements.length) {
      return registeredFiles;
    }

    const absentRequirementSet = this.getAbsentRequirementSet(
      newRequirements,
      allRequirements
    );

    // Ignore (remove from final set) GRI-based requirements that are covered by
    // existing parent requirements.
    const parentBasedRequirements = allRequirements.filter(requirement =>
      requirement.getQueryType() === 'parentId' &&
      !absentRequirementSet.has(requirement)
    );
    for (const parentRequirement of parentBasedRequirements) {
      const filesWithParentMatching = registeredFiles.filter(file =>
        parentRequirement.matchesFile(file)
      );
      for (const file of filesWithParentMatching) {
        for (const newRequirement of absentRequirementSet.values()) {
          // Checking if parent requirement properties contains new requirement
          // properties is simplified - there could be more requirements for the same
          // parent that makes a properties sum containing new requirement properties, but
          // in most cases it should be enough to check parent requirement properties
          // one-by-one.
          if (
            newRequirement.matchesFile(file) &&
            includesAll(parentRequirement.properties, newRequirement.properties)
          ) {
            absentRequirementSet.delete(newRequirement);
          }
        }
      }
    }

    return registeredFiles.filter(storedFile => {
      for (const requirement of absentRequirementSet.values()) {
        if (requirement.matchesFile(storedFile)) {
          return true;
        }
      }
      return false;
    });
  },

  /**
   * @private
   * @param {Array<FileModel.Property>} properties
   * @returns {Array<File.RawAttribute>}
   */
  propertiesToAttrs(properties) {
    /** @type {Array<File.RawAttribute>} */
    const attributes = [];
    for (const property of properties) {
      // By default, the name of attribute is the same as property. If there is no such
      // attribute, it means that it could be an artificial property that was
      // created in file serializer, that does not need an attribute.
      const attr = propertyToAttributesMap[property] ??
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

  /**
   * Updates properties cache when adding or removing requirements.
   * @private
   * @param {boolean} isAdding Use `true` when requiements are added and `false` when
   *   requirements are removed from registry.
   * @param {...FileRequirement} requirement
   */
  updatePropertiesCache(isAdding, ...requirements) {
    if (_.isEmpty(requirements)) {
      return;
    }
    for (const req of requirements) {
      switch (req.getQueryType()) {
        case 'parentId':
          this.changeCounterCache({
            cacheName: 'propertiesForParentId',
            properties: req.properties,
            key: req.parentId,
            diff: isAdding ? 1 : -1,
          });
          break;
        case 'fileGri':
          this.changeCounterCache({
            cacheName: 'propertiesForFileGri',
            properties: req.properties,
            key: req.fileGri,
            diff: isAdding ? 1 : -1,
          });
          break;
        default:
          break;
      }
    }
  },

  /**
   * Modifies selected properties counter in cache by diff.
   * @param {'propertiesForParentId'|'propertiesForFileGri'} cacheName
   * @param {string} key Either `fileGri` or `parentId`.
   * @param {Array<FileModel.Property>} properties
   * @param {-1|1} diff
   */
  changeCounterCache({ cacheName, key, properties, diff }) {
    const propertyMap = (this[cacheName][key] ??= new Map());
    for (const property of properties) {
      const prev = propertyMap.get(property);
      propertyMap.set(property, (prev ?? 0) + diff);
    }
  },
});
