import Service, { inject as service } from '@ember/service';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import {
  possibleFileRawAttributesSet,
  propertyToAttributesMap,
} from 'oneprovider-gui/utils/file-model';
import _ from 'lodash';
import { computed } from '@ember/object';
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
  store: service(),

  //#region configuration

  // FIXME: maybe add more, maybe remove type...
  basicProperties: Object.freeze([
    'conflictingName',
    'fileId',
    'hasParent',
    'name',
    'parent',
    'type',
    // FIXME: for testing:
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
   * @param {Array<Utils.FileQuery>} queries
   * @returns {Array<File.RawAttribute>}
   */
  findAttrsRequirement(...queries) {
    let matchingRequirements = [this.basicRequirement];
    for (const query of queries) {
      matchingRequirements.push(
        ...this.getRequirements().filter(requirement => query.matches(requirement))
      );
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
   * @returns {Promise<PromiseState<Models.File>>}
   */
  async setRequirements(consumer, requirements) {
    const reqArray = Array.isArray(requirements) ? requirements : [requirements];
    const filesToUpdate = this.getFilesToUpdate(consumer, requirements);
    this.consumerRequirementsMap.set(consumer, reqArray);
    await allSettled(filesToUpdate.map(file => {
      return file.reload();
    }));
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
   * @private
   * @param {FileConsumer} consumer
   * @param {Array<FileRequirement>} newRequirements
   * @returns {Array<FileRequirement>}
   */
  getAbsentRequirements(consumer, newRequirements) {
    const currentRequirements = this.consumerRequirementsMap.get(consumer);
    if (!currentRequirements?.length) {
      return [...newRequirements];
    }

    const currentRequirementsStringified =
      currentRequirements.map(req => req.stringify());
    const newConditions =
      _.differenceWith(newRequirements, currentRequirements, (ra, rb) =>
        ra.matches(rb)
      );
    const newReqOldConditions = _.difference(newRequirements, newConditions);
    const oldConditionsWithNewProperties = newReqOldConditions.filter(newReq => {
      // filter out identical requirements
      if (currentRequirementsStringified.includes(newReq.stringify())) {
        return false;
      }
      // search for at least one property in new requirement that does not occur
      // in current requirements
      for (const currentReq of currentRequirements) {
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
    return _.uniq([...newConditions, ...oldConditionsWithNewProperties]);
  },

  // FIXME: optymalizacja: jeśli nie było do tej pory requirementów - powinno pobrać wszystkie pasujące pliki
  // FIXME: optymalizacja: brać pliki dla konsumera poprzez fileRecordRegistry?
  /**
   * @private
   * @param {FileConsumer} consumer
   * @param {Array<FileRequirement>} newRequirements
   * @returns {Array<Models.File>}
   */
  getFilesToUpdate(consumer, newRequirements) {
    if (!newRequirements?.length) {
      return [];
    }
    const absentRequirements = this.getAbsentRequirements(consumer, newRequirements);
    const storedFiles = this.store.peekAll('file').toArray();
    return storedFiles.filter(storedFile => {
      return absentRequirements.some(requirement => {
        return requirement.matchesFile(storedFile);
      });
    });
  },

  /**
   * @private
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
