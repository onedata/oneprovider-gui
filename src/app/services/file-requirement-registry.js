import Service from '@ember/service';
import FileRequirement from 'oneprovider-gui/utils/file-requirement';
import {
  possibleFileRawAttributesSet,
  // FIXME: for testing
  // possibleFileProperties,
  propertyToAttributesMap,
} from 'oneprovider-gui/utils/file-model';
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
 * @typedef {Object} FileConsumer
 * @property {Array<Utils.FileRequirement>} fileRequirements
 * @property {Array<Models.File>} usedFiles
 */

// FIXME: ten service może służyć jako projektowane FileRecordsRegistry
// - wszystkie załadowane pliki: store.peekAll('file')
// - zmienia się requirement:

// FIXME: scrollujemy się w dół, zmieniamy kolumny - najłatwiej byłoby przeładować wszystkie pliki w storze peekAll, które pasują do zmienionych requirementów
// był taki pomysł: listę plików bierzemy z service FileRecordsRegistry
// ten service działa jakby bufor na ładowanie/wyładowywanie rekordów plików - każdy komponent rejestruje to co używa i wyrejestrowuje tego co nie używa
// jeśli licznik spadnie do 0 to file usuwane jest ze stora
// usunięcie nastąpi np. podczas odświeżenia listy - część plików staje się invalidowana i dodatkowo komponent powinien zgłosić, że ich nie potrzebuje

// FIXME: jeśli globalna lista

export default Service.extend({
  //#region configuration

  // FIXME: maybe add more, maybe remove type...
  basicProperties: Object.freeze([
    'fileId',
    'name',
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
