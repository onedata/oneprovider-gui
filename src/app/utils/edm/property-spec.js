/**
 * Specifications of EDM properties for constructing specific EDM property models.
 * Based on Eureka 3D specification.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import { getLangSelectorOptions } from './lang-spec';
import EdmObjectType, { EdmObjectTagName } from './object-type';

/**
 * @typedef {'dc'|'dcterms'|'edm'} EdmPropertyNamespace
 */

/**
 * For available EDM properties, see:
 * - https://europeana.atlassian.net/wiki/spaces/EF/pages/2106294284/edm+ProvidedCHO
 * - https://europeana.atlassian.net/wiki/spaces/EF/pages/2106032160/ore+Aggregation
 * - https://europeana.atlassian.net/wiki/spaces/EF/pages/2106392591/edm+WebResource
 *
 * But note, that only a subset is used in Europeana!
 * @typedef {string} EdmPropertyName
 */

/**
 * Container for specs of the property with the same XML namespace and tag, but in
 * different EDM object context.
 * @typedef {Object} EdmPropertySpecContainer
 * @property {EdmPropertySpec} [EdmObjectType.Aggregation]
 * @property {EdmPropertySpec} [EdmObjectType.ProvidedCHO]
 * @property {EdmPropertySpec} [EdmObjectType.WebResource]
 */

/**
 * Container for specs of the value in the different EdmPropertyValueType contexts.
 * Eg. a placeholder can be different for literal values and references (or can be
 * empty for reference).
 * @typedef {Object} EdmPropertySpecValues
 * @property {string} [EdmPropertyValueType.Literal]
 * @property {string} [EdmPropertyValueType.Reference]
 */

/**
 * @typedef {Object} EdmPredefinedValue
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {Object} EdmPredefinedValueGroup
 * @property {string} groupName
 * @property {Array<EdmPredefinedValue>}
 */

/**
 * @typedef {Array<EdmPredefinedValue|EdmPredefinedValueGroup>} EdmPredefinedValueOptions
 */

/**
 * @typedef {Object} EdmPropertySpec
 * @property {EdmPropertyValueType} val How the data should be stored in the XML - see
 *   `EdmPropertyValueType`.
 * @property {EdmObjectType} obj Object type in which the property can be used.
 * @property {EdmPropertyRecommendation} rec Level of usage recommendation - see
 *   `EdmPropertyRecommendation`
 * @property {EdmPropertyMaxOccurrences} max Level of property maximum occurrences in
 *   single EDM object - see `EdmPropertyMaxOccurrences`.
 * @property {boolean} [viewOnly] If true, then the property will be not available to
 *   select when adding new property. It will be only visible if it is defined in XML.
 * @property {EdmPredefinedValueOptions} [predef] If provided, the property has predefined
 *   set of values that should be applied to the property. The `label` is shown in the
 *   visual editor and `value` is applied as property value.
 * @property {boolean} [predefGrouped] If true, predef is considered to be array of
 *   EdmPredefinedValueGroup.
 * @property {boolean|string} [lang] If truish, the optional language (`lang` XML
 *   attribute) can be set for the property. If it is a non-empty string - the language
 *   will be automatically set to the provided language code on init and can be changed by
 *   user.
 * @property {string} [def] Default value.
 * @property {boolean} [long] The string value is typically long and could contain line
 *   breaks. Effectively, it will be displayed as textarea in the visual editor.
 * @property {string} [example] The example of value displayed in tooltip.
 * @property {string|EdmPropertySpecValues} [placeholder] The example in the input
 * placeholder.
 * @property {boolean} [disabled] If true, the field is always disabled.
 * @property {boolean|RegExp} [custom] If true, allows to input custom values for
 *   properties with predefined set of values without validation error. If it is a RegExp
 *   instance, allow only custom values that matche the regexp.
 */

/**
 * @typedef {Object} EdmPropertyCreationData
 * @property {EdmObjectType} objectType
 * @property {string} namespace
 * @property {string} name
 * @property {`${string}:${string}`} xmlTagName
 * @property {EdmPropertySpec} spec
 */

/**
 * Maps XML namespace -> property tag name -> EdmPropertySpec | EdmPropertySpecContainer.
 * @typedef {Object} EdmPropertySpecMap
 */

/**
 * How the value should be stored for property in the XML.
 */
export const EdmPropertyValueType = Object.freeze({
  /** The value will be stored as XML tag value: `<tag>value</tag>` */
  Literal: 'literal',
  /** The value will be stored in the `resource` attribute: `<tag resource="value" />` */
  Reference: 'reference',
  /** The value should be stored either as literal value or reference */
  Any: 'any',
});

/**
 * Is the presence of property mandatory for the object or optional?
 * Based on Eureka3D recommendations.
 */
export const EdmPropertyRecommendation = Object.freeze({
  /** There should be at least single occurrence of the property in the object. */
  Mandatory: 'mandatory',
  /** It is completely optional to have the property in the object. */
  None: 'none',
});

/**
 * How many properties of the type is allowed for the object.
 * This enum does not determine minimum occurrences of the property - see
 * `EdmPropertyRecommendation.Mandatory` for the miniumum single occurrence.
 * Based on Eureka3D recommendations.
 */
export const EdmPropertyMaxOccurrences = Object.freeze({
  /** There can be maxium single occurrence of the property in the object. */
  Single: '1',
  /** There are no limits in the property occurrences in the single object. */
  Any: 'n',
});

// Aliases for the shorter code
const Rec = EdmPropertyRecommendation;
const Max = EdmPropertyMaxOccurrences;

const locationCommon = {
  tip: '<strong>Example:</strong><br>https://www.wikidata.org/wiki/Q4093<br>http://sws.geonames.org/2950159<br>https://vocab.getty.edu/tgn/7006663<p>When it is a <strong>literal</strong>, use a coordinate in this format:<br>48.833611111, 2.375833333',
  placeholder: {
    [EdmPropertyValueType.Literal]: '48.833611111, 2.375833333',
    [EdmPropertyValueType.Reference]: 'https://www.wikidata.org/wiki/Q4093',
  },
};

/**
 * @type {EdmPropertySpecMap}
 */
let allSpecsCache;

/**
 * @returns {EdmPropertySpecMap}
 */
export function getAllSpecs() {
  return allSpecsCache ??= createAllSpecs();
}

// TODO: VFS-12238 Currently titles of properties are placed in 18n file:
// src/app/locales/en/components/visual-edm/property.js and other strings, like tip
// and examples are placed in the spec. Consider moving all texts either to spec (so all
// the data will be placed in one file which make it better to read) or to translations
// (which is best practice for i18n).

/**
 * @returns {EdmPropertySpecMap}
 */
function createAllSpecs() {
  return {
    dc: {
      contributor: {
        val: EdmPropertyValueType.Any,
        obj: EdmObjectType.ProvidedCHO,
        lang: true,
        rec: Rec.None,
        max: Max.Any,
        tip: 'It can include, for example, a donor.',
      },
      creator: {
        [EdmObjectType.ProvidedCHO]: {
          val: EdmPropertyValueType.Any,
          obj: EdmObjectType.ProvidedCHO,
          lang: true,
          rec: Rec.None,
          max: Max.Any,
          example: 'http://www.wikidata.org/entity/Q604667',
        },
        [EdmObjectType.WebResource]: {
          val: EdmPropertyValueType.Any,
          obj: EdmObjectType.WebResource,
          lang: true,
          rec: Rec.None,
          max: Max.Any,
        },
      },
      description: {
        [EdmObjectType.ProvidedCHO]: {
          val: EdmPropertyValueType.Literal,
          obj: EdmObjectType.ProvidedCHO,
          rec: Rec.Mandatory,
          max: Max.Any,
          lang: 'en',
          long: true,
          example: 'Studio portrait of a young woman with a necklace',
          placeholder: 'Studio portrait of a young woman with a necklace',
        },
        [EdmObjectType.WebResource]: {
          val: EdmPropertyValueType.Literal,
          obj: EdmObjectType.WebResource,
          rec: Rec.Mandatory,
          max: Max.Any,
          lang: 'en',
          long: true,
          example: 'Georeferenced photogrammetric mesh model of the Holy Cross Church. The digitisation was made through UAV and terrestrial photogrammetry.',
          placeholder: 'Georeferenced photogrammetric mesh model of the Holy Cross Church. The digitisation was made through UAV and terrestrial photogrammetry.',
        },
      },
      format: {
        val: EdmPropertyValueType.Literal,
        obj: EdmObjectType.WebResource,
        lang: false,
        rec: Rec.None,
        max: Max.Any,
        predef: get3DFormats().map(formatLiteral => ({
          label: formatLiteral,
          value: formatLiteral,
        })),
      },
      identifier: {
        val: EdmPropertyValueType.Literal,
        obj: EdmObjectType.WebResource,
        lang: true,
        rec: Rec.None,
        max: Max.Single,
        example: 'RP-T1952-380, 0001',
        placeholder: 'RP-T1952-380',
      },
      language: {
        val: EdmPropertyValueType.Literal,
        obj: EdmObjectType.ProvidedCHO,
        rec: Rec.None,
        max: Max.Any,
        // The first item is "Default" (empty) language, but we require value for each
        // property.
        predef: getLangSelectorOptions().slice(1),
      },
      rights: {
        val: EdmPropertyValueType.Literal,
        obj: EdmObjectType.Aggregation,
        lang: true,
        rec: Rec.None,
        max: Max.Any,
        example: 'Copyright © British Library Board',
        placeholder: 'Copyright © British Library Board',
      },
      subject: {
        val: EdmPropertyValueType.Any,
        obj: EdmObjectType.ProvidedCHO,
        rec: Rec.Mandatory,
        max: Max.Any,
        lang: 'en',
        example: 'Christian Orthodox Church / Chalcolithic wine jar / Brass instrument / Still life painting',
        placeholder: {
          [EdmPropertyValueType.Literal]: 'Christian Orthodox Church',
        },
      },
      title: {
        val: EdmPropertyValueType.Literal,
        obj: EdmObjectType.ProvidedCHO,
        rec: Rec.Mandatory,
        max: Max.Any,
        lang: 'en',
        example: 'Portrait of a young woman / Saint Paul\'s Cathedral / Mona Lisa',
        tip: 'The title of this Public Data record in the EDM metadata. It\'s independent of the share name that will be displayed on the public view. To unify them, you may adjust the share name using the actions menu.',
        placeholder: {
          [EdmPropertyValueType.Literal]: 'Saint Paul\'s Cathedral',
        },
      },
      type: {
        [EdmObjectType.ProvidedCHO]: {
          val: EdmPropertyValueType.Any,
          obj: EdmObjectType.ProvidedCHO,
          rec: Rec.Mandatory,
          max: Max.Single,
          lang: true,
          tip: 'It is suggested to use a reference from e.g. Getty glossary.<p><strong>Example of literals:</strong> Musical instrument / Church / Still image / Painting / Building',
          placeholder: {
            [EdmPropertyValueType.Literal]: 'Musical instrument',
          },
        },
        [EdmObjectType.WebResource]: {
          val: EdmPropertyValueType.Literal,
          obj: EdmObjectType.WebResource,
          rec: Rec.Mandatory,
          max: Max.Single,
          lang: true,
          example: 'Photogrammetric mesh model / TLS point cloud / NURBS model',
          placeholder: {
            [EdmPropertyValueType.Literal]: 'Photogrammetric mesh model',
          },
        },
      },
    },
    dcterms: {
      created: {
        [EdmObjectType.ProvidedCHO]: {
          val: EdmPropertyValueType.Any,
          obj: EdmObjectType.ProvidedCHO,
          lang: true,
          rec: Rec.None,
          max: Max.Any,
          example: '1900-02-21',
          placeholder: {
            [EdmPropertyValueType.Literal]: '1900-02-21',
          },
        },
        [EdmObjectType.WebResource]: {
          val: EdmPropertyValueType.Any,
          obj: EdmObjectType.WebResource,
          lang: true,
          rec: Rec.None,
          max: Max.Single,
          example: '1900-02-21',
          placeholder: {
            [EdmPropertyValueType.Literal]: '1900-02-21',
          },
        },
      },
      extent: {
        [EdmObjectType.ProvidedCHO]: {
          val: EdmPropertyValueType.Literal,
          obj: EdmObjectType.ProvidedCHO,
          lang: true,
          long: true,
          rec: Rec.None,
          max: Max.Any,
          example: '<br>13 cm (width)<br>20 cm (length)<br>10 cm (height)',
          placeholder: '\n13 cm (width)\n20 cm (length)\n10 cm (height)',
          tip: 'References the size of the object.',
        },
        [EdmObjectType.WebResource]: {
          val: EdmPropertyValueType.Literal,
          obj: EdmObjectType.WebResource,
          rec: Rec.Mandatory,
          max: Max.Single,
          disabled: true,
          tip: 'This value is filled automatically.',
        },
      },
      isFormatOf: {
        val: EdmPropertyValueType.Reference,
        obj: EdmObjectType.WebResource,
        rec: Rec.None,
        max: Max.Single,
      },
      isPartOf: {
        val: EdmPropertyValueType.Any,
        obj: EdmObjectType.ProvidedCHO,
        rec: Rec.Mandatory,
        max: Max.Any,
        lang: true,
        example: 'Crace Collection of Maps of London / EUreka3D / Church of...',
        placeholder: {
          [EdmPropertyValueType.Literal]: 'Crace Collection of Maps of London',
        },
      },
      isReferencedBy: {
        val: EdmPropertyValueType.Reference,
        obj: EdmObjectType.WebResource,
        rec: Rec.None,
        max: Max.Single,
      },
      medium: {
        val: EdmPropertyValueType.Reference,
        obj: EdmObjectType.ProvidedCHO,
        lang: false,
        rec: Rec.Mandatory,
        max: Max.Any,
        tip: 'List of materials making up the original object. You should define as many materials as possible by repeating this field. The predefined list provides the main material categories, but you can use the XML editor to be more specific. Accepted vocabularies are Getty (e.g. http://vocab.getty.edu/aat/300010439) and Wikidata (e.g. http://www.wikidata.org/entity/Q13085).',
        custom: /^(https?:\/\/vocab\.getty\.edu\/aat\/\d+)|(https?:\/\/www\.wikidata\.org\/entity\/(\w|-)+)$/,
        predefGrouped: true,
        predef: [
          { label: 'Bone', value: 'http://vocab.getty.edu/aat/300011798' },
          { label: 'Ceramic', value: 'http://vocab.getty.edu/aat/300235507' },
          { label: 'Clay', value: 'http://vocab.getty.edu/aat/300010439' },
          { label: 'Concrete', value: 'http://vocab.getty.edu/aat/300010737' },
          {
            groupName: 'Glass',
            options: [
              { label: 'Glass (non-specific)', value: 'http://vocab.getty.edu/aat/300010797' },
              { label: 'Biscuit (porcelain, material)', value: 'http://vocab.getty.edu/aat/300242297' },
              { label: 'Ceramic (material)', value: 'http://vocab.getty.edu/aat/300235507' },
              { label: 'Lenses', value: 'http://vocab.getty.edu/aat/300266807' },
              { label: 'Mirrors', value: 'http://vocab.getty.edu/aat/300037682' },
              { label: 'Feldspar', value: 'http://vocab.getty.edu/aat/300011087' },
              { label: 'Ground glass', value: 'http://vocab.getty.edu/aat/300010847' },
            ],
          },
          { label: 'Leather', value: 'http://vocab.getty.edu/aat/300011845' },
          {
            groupName: 'Metal',
            options: [
              { label: 'Metal (non-specific)', value: 'http://vocab.getty.edu/aat/300010900' },
              { label: 'Alloy', value: 'http://vocab.getty.edu/aat/300010902' },
              { label: 'Steel (alloy)', value: 'http://vocab.getty.edu/aat/300133751' },
              { label: 'Copper alloy', value: 'http://vocab.getty.edu/aat/300010942' },
              { label: 'Aluminum (metal)', value: 'http://vocab.getty.edu/aat/300011015' },
              { label: 'Bronze (metal)', value: 'http://vocab.getty.edu/aat/300010957' },
              { label: 'Furniture hardware', value: 'http://vocab.getty.edu/aat/300045374' },
              { label: 'Iron (metal)', value: 'http://vocab.getty.edu/aat/300011002' },
              { label: 'Lost-wax process', value: 'http://vocab.getty.edu/aat/300053113' },
              { label: 'Engraving (action)', value: 'http://vocab.getty.edu/aat/300053829' },
              { label: 'Brass (alloy)', value: 'http://vocab.getty.edu/aat/300010946' },
              { label: 'Magnetism', value: 'http://vocab.getty.edu/aat/300195455' },
              { label: 'Mercury', value: 'http://vocab.getty.edu/aat/300011026' },
              { label: 'Nickel (metal)', value: 'http://vocab.getty.edu/aat/300011028' },
              { label: 'Rust', value: 'http://vocab.getty.edu/aat/300213355' },
              { label: 'Embossing (technique)', value: 'http://vocab.getty.edu/aat/300053826' },
            ],
          },
          { label: 'Mortar', value: 'http://vocab.getty.edu/aat/300014741' },
          {
            groupName: 'Paper',
            options: [
              { label: 'Paper (non-specific)', value: 'http://vocab.getty.edu/aat/300014109' },
              { label: 'Albumen paper', value: 'http://vocab.getty.edu/aat/300411855' },
              { label: 'Rag paper', value: 'http://vocab.getty.edu/aat/300014130' },
              { label: 'Cardboard', value: 'http://vocab.getty.edu/aat/300014224' },
              { label: 'Labels (identifying artifacts)', value: 'http://vocab.getty.edu/aat/300028730' },
              { label: 'Stereoscopic photographs', value: 'http://vocab.getty.edu/aat/300162872' },
              { label: 'Printing paper', value: 'http://vocab.getty.edu/aat/300014172' },
              { label: 'Machine-made paper', value: 'http://vocab.getty.edu/aat/300411878' },
              { label: 'Handmade', value: 'http://vocab.getty.edu/aat/300191818' },
              { label: 'Carbon paper', value: 'http://vocab.getty.edu/aat/300014156' },
              { label: 'Newsprint', value: 'http://vocab.getty.edu/aat/300014137' },
              { label: 'Drawing paper', value: 'http://vocab.getty.edu/aat/300014157' },
              { label: 'Coated paper', value: 'http://vocab.getty.edu/aat/300312356' },
              { label: 'Photographic paper', value: 'http://vocab.getty.edu/aat/300014190' },
              { label: 'Tissue paper', value: 'http://vocab.getty.edu/aat/300014145' },
              { label: 'Tracing paper', value: 'http://vocab.getty.edu/aat/300014161' },
            ],
          },
          { label: 'Papyrus', value: 'http://vocab.getty.edu/aat/300014127' },
          { label: 'Plaster', value: 'http://vocab.getty.edu/aat/300014922' },
          { label: 'Stone', value: 'http://vocab.getty.edu/aat/300011692' },
          { label: 'Textile', value: 'http://vocab.getty.edu/aat/300231565' },
          {
            groupName: 'Wood',
            options: [
              { label: 'Wood (non-specific)', value: 'http://vocab.getty.edu/aat/300011914' },
              { label: 'Mahogany (wood)', value: 'http://vocab.getty.edu/aat/300012221' },
              { label: 'Chestnut (wood)', value: 'http://vocab.getty.edu/aat/300012039' },
              { label: 'Color (perceived attribute)', value: 'http://vocab.getty.edu/aat/300056130' },
              { label: 'Coniferophyta (division)', value: 'http://vocab.getty.edu/aat/300265702' },
              { label: 'Plant fiber', value: 'http://vocab.getty.edu/aat/300014031' },
              { label: 'Angiospermae (division)', value: 'http://vocab.getty.edu/aat/300265706' },
              { label: 'Grain (structure)', value: 'http://vocab.getty.edu/aat/300219467' },
              { label: 'Coarse-grain material', value: 'http://vocab.getty.edu/aat/300014650' },
              { label: 'Fine-grain material', value: 'http://vocab.getty.edu/aat/300014645' },
              { label: 'Medium-grain material', value: 'http://vocab.getty.edu/aat/300014648' },
              { label: 'Laminate', value: 'http://vocab.getty.edu/aat/300250554' },
              { label: 'Marquetry (process or technique)', value: 'http://vocab.getty.edu/aat/300053853' },
              { label: 'Walnut (wood)', value: 'http://vocab.getty.edu/aat/300012476' },
              { label: 'Pine', value: 'http://vocab.getty.edu/aat/300012620' },
              { label: 'Dendrochronology', value: 'http://vocab.getty.edu/aat/300054715' },
            ],
          },
        ],
      },
      spatial: {
        val: EdmPropertyValueType.Any,
        obj: EdmObjectType.ProvidedCHO,
        rec: Rec.None,
        max: Max.Any,
        ...locationCommon,
      },
    },
    edm: {
      aggregatedCHO: {
        val: EdmPropertyValueType.Reference,
        basic: false,
        obj: EdmObjectType.Aggregation,
        // it is added by backend
        viewOnly: true,
        rec: Rec.None,
        max: Max.Single,
      },
      currentLocation: {
        val: EdmPropertyValueType.Any,
        obj: EdmObjectType.ProvidedCHO,
        rec: Rec.None,
        max: Max.Single,
        ...locationCommon,
      },
      dataProvider: {
        val: EdmPropertyValueType.Any,
        obj: EdmObjectType.Aggregation,
        lang: true,
        rec: Rec.Mandatory,
        max: Max.Single,
        example: 'Zuidwestbrabants Museum',
        placeholder: {
          [EdmPropertyValueType.Literal]: 'Zuidwestbrabants Museum',
        },
      },
      intermediateProvider: {
        val: EdmPropertyValueType.Any,
        obj: EdmObjectType.Aggregation,
        lang: true,
        rec: Rec.None,
        max: Max.Any,
        tip: 'The name of an intermediate organization that selects, collates, or curates the object on behalf of the content provider institution',
      },
      isShownAt: {
        val: EdmPropertyValueType.Reference,
        obj: EdmObjectType.Aggregation,
        rec: Rec.None,
        max: Max.Single,
      },
      isShownBy: {
        val: EdmPropertyValueType.Reference,
        obj: EdmObjectType.Aggregation,
        // it is added by backend
        viewOnly: true,
        rec: Rec.None,
        max: Max.Single,
      },
      object: {
        val: EdmPropertyValueType.Reference,
        obj: EdmObjectType.Aggregation,
        rec: Rec.None,
        max: Max.Single,
      },
      provider: {
        // Comment from EUreka3D:
        // In future this should be a limited list of values, BUT for the time being we
        // agreed to use "Photoconsortium" for all EUreka3D content. So we will not ask the
        // user for the time being (although alternatively we could use a combo box with
        // only one available option)
        val: EdmPropertyValueType.Literal,
        obj: EdmObjectType.Aggregation,
        rec: Rec.Mandatory,
        max: Max.Single,
        predef: [{
          label: 'Photoconsortium',
          value: 'Photoconsortium',
        }],
        def: 'Photoconsortium',
      },
      rights: {
        val: EdmPropertyValueType.Reference,
        obj: EdmObjectType.Aggregation,
        rec: Rec.Mandatory,
        max: Max.Single,
        // Predefined values from EUreka 3D specification
        predef: getLicenses(),
        tip: 'See: https://pro.europeana.eu/page/available-rights-statements',
      },
      type: {
        val: EdmPropertyValueType.Literal,
        obj: EdmObjectType.ProvidedCHO,
        rec: Rec.Mandatory,
        max: Max.Single,
        predef: ['3D', 'TEXT', 'VIDEO', 'SOUND', 'IMAGE'].map(value =>
          ({ value, label: value })
        ),
        def: '3D',
      },
    },
  };
}

function createSupportedTags() {
  const allSpecs = getAllSpecs();
  const array = [];
  for (const namespace of Object.keys(allSpecs)) {
    for (const propertyName of Object.keys(allSpecs[namespace])) {
      array.push(`${namespace}:${propertyName}`);
    }
  }
  return array;
}

let supportedPropertyTagSetCache;

export function getSupportedPropertyTagSet() {
  return supportedPropertyTagSetCache ??= Object.freeze(new Set(createSupportedTags()));
}

/**
 * Checks if object is a `EdmPropertySpecNamespaceContainer`.
 * @param {Object} object
 * @returns {boolean}
 */
export function isSpecContainer(object) {
  const possibleContainerKeys = Object.keys(EdmObjectType);
  const keys = Object.keys(object);
  return possibleContainerKeys.includes(keys[0]);
}

/**
 *
 * @param {EdmObjectType} objectType
 * @param {string} name
 * @param {string} namespace
 * @param {EdmPropertySpec} spec
 * @returns {EdmPropertyCreationData}
 */
function createPropertyCreationData(objectType, name, namespace, spec) {
  return Object.freeze({
    objectType,
    name,
    namespace,
    xmlTagName: `${namespace}:${name}`,
    spec,
  });
}

function createAllPropertiesCreationData() {
  const allSpecs = getAllSpecs();
  const items = [];

  for (const [namespace, namespaceSpecs] of Object.entries(allSpecs)) {
    for (const [name, specOrContainer] of Object.entries(namespaceSpecs)) {
      if (isSpecContainer(specOrContainer)) {
        for (const spec of Object.values(specOrContainer)) {
          items.push(createPropertyCreationData(spec.obj, name, namespace, spec));
        }
      } else {
        items.push(
          createPropertyCreationData(
            specOrContainer.obj,
            name,
            namespace,
            specOrContainer
          )
        );
      }
    }
  }
  return items;
}

let allPropertyDataCache;

/**
 * @type {Array<EdmPropertyCreationData>}
 */
export function getAllPropertyData() {
  return allPropertyDataCache ??= Object.freeze(createAllPropertiesCreationData());
}

let tagToPropertyDataMapCache;

/**
 * 2-level mapping: EdmObjectType -> xmlTagName -> EdmPropertyCreationData (contains spec)
 * @type {Object<string, EdmPropertyCreationData>}
 */
export function getTagToPropertyDataMap() {
  const allPropertyData = getAllPropertyData();
  if (!tagToPropertyDataMapCache) {
    tagToPropertyDataMapCache = {
      [EdmObjectTagName[EdmObjectType.ProvidedCHO]]: [],
      [EdmObjectTagName[EdmObjectType.WebResource]]: [],
      [EdmObjectTagName[EdmObjectType.Aggregation]]: [],
    };
    for (const data of allPropertyData) {
      const targetArray = tagToPropertyDataMapCache[EdmObjectTagName[data.objectType]];
      targetArray[data.xmlTagName] = data;
    }
  }
  return tagToPropertyDataMapCache;
}

function get3DFormats() {
  return [
    '3DM',
    '3DMF',
    '3DMLW',
    '3DPDF',
    '3DS',
    '3MF  ',
    'ABC',
    'AC',
    'AMF',
    'AN8',
    'AOI',
    'APRX',
    'ASCII',
    'ASM',
    'B3D',
    'BDL4',
    'BFRES',
    'BIM',
    'BLEND',
    'BMD3',
    'BRRES',
    'C4D',
    'Cal3D',
    'CCP4',
    'CFL',
    'COB',
    'CSG',
    'CTM',
    'DAE',
    'DFF',
    'DPM',
    'DTS',
    'DWF',
    'DWG',
    'E57',
    'EGG',
    'FACT',
    'FBX',
    'FLS',
    'FWS',
    'GeoPDF',
    'GeoTIFF',
    'GLM',
    'glTF',
    'GML',
    'IFC',
    'IGES',
    'IGES',
    'IOB',
    'JAS',
    'JT',
    'KML/KMZ',
    'LAS',
    'LWO',
    'LWS',
    'LXF',
    'LXO',
    'M3D',
    'MA',
    'MAX',
    'MB',
    'MD2',
    'MD3',
    'MD5',
    'MDX',
    'MESH',
    'MM3D',
    'MPO',
    'MRC',
    'NIF',
    'NURBS',
    'NURMS',
    'OBJ',
    'OFF',
    'OpenGEX',
    'PDF/E-1',
    'PLA',
    'PLN',
    'PLY',
    'POV-Ray',
    'PRC',
    'PRT',
    'Ptex',
    'PTM',
    'QGS',
    'R3D',
    'RTI',
    'RVT',
    'RWX',
    'SKP',
    'SKP',
    'SLDASM',
    'SLDPRT',
    'SMD',
    'STEP',
    'STL',
    'U3D',
    'USD',
    'USDC',
    'USDZ',
    'VIM',
    'VRML',
    'VRML97',
    'VUE',
    'VWX',
    'W3D',
    'WINGS',
    'X',
    'X3D',
    'XR',
    'XYZ',
    'Z3D',
    'ZFC',
    'ZFS',
  ];
}

function getLicenses() {
  return [{
      label: 'CC BY 4.0',
      value: 'http://creativecommons.org/licenses/by/4.0/',
    },
    {
      label: 'CC BY-SA 4.0',
      value: 'http://creativecommons.org/licenses/by-sa/4.0/',
    },
    {
      label: 'CC BY-ND 4.0',
      value: 'http://creativecommons.org/licenses/by-nd/4.0/',
    },
    {
      label: 'CC BY-NC 4.0',
      value: 'http://creativecommons.org/licenses/by-nc/4.0/',
    },
    {
      label: 'CC BY-NC-SA 4.0',
      value: 'http://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
    {
      label: 'CC BY-NC-ND 4.0',
      value: 'http://creativecommons.org/licenses/by-nc-nd/4.0/',
    },
    {
      label: 'NoC-NC',
      value: 'http://rightsstatements.org/vocab/NoC-NC/1.0/',
    },
    {
      label: 'NoC-OKLR',
      value: 'http://rightsstatements.org/vocab/NoC-OKLR/1.0/',
    },
    {
      label: 'InC',
      value: 'http://rightsstatements.org/vocab/InC/1.0/',
    },
    {
      label: 'InC-EDU',
      value: 'http://rightsstatements.org/vocab/InC-EDU/1.0/',
    },
    {
      label: 'InC-OW-EU',
      value: 'http://rightsstatements.org/vocab/InC-OW-EU/1.0/',
    },
    {
      label: 'CNE',
      value: 'http://rightsstatements.org/vocab/CNE/1.0/',
    },
    {
      label: 'CC0 1.0',
      value: 'http://creativecommons.org/publicdomain/zero/1.0/',
    },
    {
      label: 'Public Domain Mark',
      value: 'http://creativecommons.org/publicdomain/mark/1.0/',
    },
  ];
}
