import Service, { inject as service } from '@ember/service';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import {
  possibleFileRawAttributesSet,
  propertyToAttributesMap,
} from 'oneprovider-gui/utils/file-model';
import _ from 'lodash';
import { get, computed } from '@ember/object';
import { allSettled } from 'rsvp';

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

// FIXME: scrollujemy się w dół, zmieniamy kolumny - najłatwiej byłoby przeładować wszystkie pliki w storze peekAll, które pasują do zmienionych requirementów
// był taki pomysł: listę plików bierzemy z service FileRecordsRegistry
// ten service działa jakby bufor na ładowanie/wyładowywanie rekordów plików - każdy komponent rejestruje to co używa i wyrejestrowuje tego co nie używa
// jeśli licznik spadnie do 0 to file usuwane jest ze stora
// usunięcie nastąpi np. podczas odświeżenia listy - część plików staje się invalidowana i dodatkowo komponent powinien zgłosić, że ich nie potrzebuje

// FIXME: jeśli globalna lista

export default Service.extend({
  fileRecordRegistry: service(),
  store: service(),

  //#region configuration

  // FIXME: maybe add more, maybe remove type...
  basicProperties: Object.freeze([
    'conflictingName',
    'effFile',
    'fileId',
    'hasParent',
    'name',
    'parent',
    'type',
    // FIXME:
    // ...possibleFileProperties,
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
   * @public
   * @param {...Utils.FileQuery} queries
   * @returns {Array<File.RawAttribute>}
   */
  findAttrsRequirement(...queries) {
    let matchingRequirements = [];
    const allRequirements = this.getRequirements();
    let allFiles;
    const getAllFiles = () => {
      if (!allFiles) {
        allFiles = this.store.peekAll('file');
      }
      return allFiles;
    };
    // FIXME: optymalizacja: można odejmować wykorzystane requirementy z allRequirements
    // FIXME: optymalizacja: nie array i uniq, tylko Set?
    for (const query of queries) {
      const queryType = query.getQueryType();

      // Select requirements directly matching the query.
      matchingRequirements.push(
        ...allRequirements.filter(requirement => query.matches(requirement))
      );
      // FIXME: co jeśli pobrany zostanie na świeżo plik, który będzie miał parenta, który jest w requirements?
      // trzeba przeanalizować problemy z tym przypadkiem i najwyżej tylko opisać

      // Select requirements for known files that have the parent matching

      switch (queryType) {
        case 'fileGri': {
          const file = getAllFiles().find(file =>
            file && get(file, 'id') === query.fileGri
          );
          if (file) {
            matchingRequirements.push(
              ...allRequirements.filter(req =>
                req.getQueryType() === 'parentId' &&
                req.parentId === file.relationEntityId('parent')
              )
            );
          }
        }
        break;
        case 'parentId': {
          const parentId = query.parentId;
          const filesForParent = getAllFiles().filter(file =>
            file?.relationEntityId('parent') === parentId
          );
          for (const file of filesForParent) {
            matchingRequirements.push(
              ...allRequirements.filter(requirement => requirement.matchesFile(file))
            );
          }
        }
        break;
        default:
          break;
      }

      // FIXME: Pytam się o propertiesy dla pliku, który pobieram, bo jest effFile pewnego
      // innego pliku.
      // Select requirements for
    }
    matchingRequirements = _.uniq(matchingRequirements);
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
   * properties for file required after reuirements set.
   * @public
   * @param {FileConsumer} consumer
   * @param {Array<Utils.FileRequirement>|Utils.FileRequirement} requirements
   * @returns {Promise<PromiseState<Models.File>>} Settled promise states of files that
   *   have been triggered to be reloaded.
   */
  async setRequirements(consumer, requirements) {
    // FIXME: zmienić requirements na spread argument
    let reqArray = Array.isArray(requirements) ? requirements : [requirements];
    reqArray = this.filterRichRequirements(reqArray);
    if (_.isEmpty(reqArray)) {
      this.consumerRequirementsMap.delete(consumer);
      return;
    }
    const filesToUpdate = this.getFilesToUpdate(requirements);
    this.consumerRequirementsMap.set(consumer, reqArray);
    return await allSettled(filesToUpdate.map(file => {
      return file.reload();
    }));
  },

  /**
   * @public
   * @param {FileConsumer} consumer
   */
  removeRequirements(consumer) {
    this.consumerRequirementsMap.delete(consumer);
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
  filterRichRequirements(requirements) {
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
    const currentPreciseRequirements = currentRequirements.filter(req =>
      req.getQueryType() !== 'none'
    );
    if (!currentPreciseRequirements?.length) {
      return new Set(newRequirements);
    }
    const newReqsNewConditions =
      _.differenceWith(newRequirements, currentPreciseRequirements, (ra, rb) =>
        ra.matches(rb)
      );
    const newReqsOldConditions = _.difference(newRequirements, newReqsNewConditions);
    const currentRequirementsStringified =
      currentPreciseRequirements.map(req => req.stringify());
    const oldConditionsWithNewProperties = newReqsOldConditions.filter(newReq => {
      // filter out identical requirements
      if (currentRequirementsStringified.includes(newReq.stringify())) {
        return false;
      }
      // search for at least one property in new requirement that does not occur
      // in current requirements
      for (const currentReq of currentPreciseRequirements) {
        if (currentReq.matches(newReq)) {
          const currentProperties = currentReq.properties;
          for (const newProperty of newReq.properties) {
            if (!currentProperties.includes(newProperty)) {
              return true;
            }
          }
        }
      }
      return false;
    });
    return new Set([...newReqsNewConditions, ...oldConditionsWithNewProperties]);
  },

  // FIXME: optymalizacja: jeśli nie było do tej pory requirementów - powinno pobrać wszystkie pasujące pliki
  // FIXME: optymalizacja: brać pliki dla konsumera poprzez fileRecordRegistry?
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
    const allRequirements = this.getRequirements();
    const absentRequirementSet =
      this.getAbsentRequirementSet(newRequirements, allRequirements);
    const storedFiles = this.fileRecordRegistry.getRegisteredFiles();

    // FIXME: wśród absentRequirements są requirementy, które odnoszą się do fileGri,
    // podczas gdy mamy już załadowane do rejestru requirementy z parentId, które pokrywają
    // już te propertiesy dla naszych plików - trzeba będzie wyrzucać te requirementy

    // reject requirements that.. FIXME: dokończyć doc
    const parentBasedRequirements = allRequirements.filter(requirement =>
      requirement.getQueryType() === 'parentId' &&
      !absentRequirementSet.has(requirement)
    );
    for (const parentRequirement of parentBasedRequirements) {
      const filesWithParent = storedFiles.filter(file =>
        parentRequirement.matchesFile(file)
      );
      // FIXME: może być wiele parent reqsów dla plików - pasuje robić sumę - komentarz
      for (const file of filesWithParent) {
        for (const newRequirement of absentRequirementSet.values()) {
          if (
            newRequirement.matchesFile(file) &&
            arrayContainsArray(parentRequirement.properties, newRequirement.properties)
          ) {
            absentRequirementSet.delete(newRequirement);
          }
        }
      }
    }

    return storedFiles.filter(storedFile => {
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
});

function arrayContainsArray(superset, subset) {
  if (0 === subset.length || superset.length < subset.length) {
    return false;
  }
  for (let i = 0; i < subset.length; ++i) {
    if (superset.indexOf(subset[i]) === -1) return false;
  }
  return true;
}
