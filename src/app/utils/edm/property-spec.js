/**
 * Specifications of EDM properties for constructing specific EDM property models.
 * Based on Eureka 3D specification.
 *
 * @author Jakub Liput
 * @copyright (C) 2024 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EdmObjectType from './object-type';
import _ from 'lodash';

/**
 * @typedef {'dc'|'dcterms'|'edm'|'owl'} EdmPropertyNamespace
 */

/**
 * For available EDM properties, see:
 * - https://europeana.atlassian.net/wiki/spaces/EF/pages/2106294284/edm+ProvidedCHO
 * - https://europeana.atlassian.net/wiki/spaces/EF/pages/2106032160/ore+Aggregation
 * - https://europeana.atlassian.net/wiki/spaces/EF/pages/2106392591/edm+WebResource
 * @typedef {string} EdmPropertyName
 */

/**
 * @typedef {Object} EdmPropertySpec
 * @property {EdmPropertyValueType} val How the data should be stored in the XML - see
 *   `EdmPropertyValueType`.
 * @property {boolean} basic If true, then the property can be added via dedicated "add
 *   property" selector in the visual editor.
 * @property {Array} obj Types of EDM objects that can use this property.
 * @property {EdmPropertyRecommendation} rec Level of usage recommendation - see
 *   `EdmPropertyRecommendation`
 * @property {EdmPropertyMaxOccurrences} max Level of property maximum occurrences in
 *   single EDM object - see `EdmPropertyMaxOccurrences`.
 * @property {Array<{ label: string, value: string }>} [predef] If provided, the property
 *   has predefined set of values that should be applied to the property. The `label` is
 *   shown in the visual editor and `value` is applied as property value.
 * @property {boolean} [lang] If true, the optional language (`lang` XML attribute) should
 *   be set for the property.
 * @property {string} [def] Default value.
 * @property {boolean} [long] The string value is typically long and could contain line
 *   breaks.
 * @property {string} [example] The example of value displayed in tooltip.
 */

/**
 * @typedef {Object} EdmPropertyCreationData
 * @property {string} namespace
 * @property {string} name
 * @property {`${string}:${string}`} xmlTagName
 * @property {EdmPropertySpec} spec
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

export const allSpecs = Object.freeze({
  dc: {
    contributor: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      lang: true,
      rec: Rec.None,
      max: Max.Any,
      example: 'name of the donor',
    },
    coverage: { obj: [EdmObjectType.ProvidedCHO] },
    creator: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      lang: true,
      rec: Rec.None,
      max: Max.Any,
      example: 'Anyone who contributed to the creation of the 3D model, donor, etc.',
    },
    date: { obj: [EdmObjectType.ProvidedCHO] },
    description: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
      lang: true,
      long: true,
      example: 'Studio portrait of a young woman with a necklace',
    },
    format: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      // According to the official EDM spec this could be used in CHO, but in the EU3D it
      // should be available only in the WR. For the code simplicity, we are currently not
      // displaying it in the CHO.
      // TODO: VFS-11952 We could add CHO object type here and make basic property
      // to be object-type-specific, because in CHO we don't want this property to be
      // selected in the dropdown.
      obj: [EdmObjectType.WebResource],
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
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      lang: true,
      rec: Rec.None,
      max: Max.Single,
      example: 'RP-T1952-380',
    },
    language: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Any,
    },
    publisher: { obj: [EdmObjectType.ProvidedCHO] },
    relation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      // TODO: VFS-11952 it is Aggregation in the EU3D spreedsheet, but not in official spec
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Any,
    },
    rights: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [
        EdmObjectType.ProvidedCHO,
        EdmObjectType.Aggregation,
        EdmObjectType.WebResource,
      ],
      lang: true,
      rec: Rec.None,
      max: Max.Any,
      example: 'Copyright © British Library Board',
    },
    source: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    subject: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
      lang: true,
      example: 'portrait / trombone / building / black-and-white photography',
    },
    title: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
      lang: true,
      example: 'Portrait of a young woman / Saint Paul\'s Cathedral / Mona Lisa',
    },
    type: {
      val: EdmPropertyValueType.Any,
      // TODO: VFS-11952 Maybe it should be not available in the WR selector
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
      lang: true,
      example: {
        // TODO: VFS-11952 Maybe there should be example of AAT link - it depends of
        // future tooltip desciption
        [
          EdmObjectType.ProvidedCHO
        ]: '(literal) trombone / musical instrument / church / still image / painting / building',
      },
      // TODO: VFS-11952 According to the EU3D spreadsheet, this could be a "Getty
      // Glossary" enun, but currently there is no valueset provided
    },
  },
  dcterms: {
    alternative: { obj: [EdmObjectType.ProvidedCHO] },
    conformsTo: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    created: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      lang: true,
      rec: Rec.None,
      max: {
        [EdmObjectType.ProvidedCHO]: Max.Any,
        [EdmObjectType.WebResource]: Max.Single,
      },
      example: '1900-02-21',
    },
    extent: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      lang: true,
      rec: Rec.None,
      max: Max.Any,
      // TODO: VFS-11952 asked in EU3D spreedsheet if it is valid
      example: {
        [EdmObjectType.ProvidedCHO]: '13 cm (width) / 20 cm (length) / 10 cm (height)',
        [EdmObjectType.WebResource]: '200 MB',
      },
    },
    hasFormat: { obj: [EdmObjectType.ProvidedCHO] },
    hasPart: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    hasVersion: { obj: [EdmObjectType.ProvidedCHO] },
    isFormatOf: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      // TODO: VFS-11952 it is Aggregation in EU3D spreedsheet, but not in official docs
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.None,
      max: Max.Any,
    },
    isPartOf: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.None,
      max: Max.Any,
      lang: true,
      example: 'Crace Collection of Maps of London / EUreka3D / Church of...',
    },
    isReferencedBy: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    isReplacedBy: { obj: [EdmObjectType.ProvidedCHO] },
    isRequiredBy: { obj: [EdmObjectType.ProvidedCHO] },
    issued: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    isVersionOf: { obj: [EdmObjectType.ProvidedCHO] },
    medium: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      lang: true,
      rec: Rec.Mandatory,
      max: Max.Any,
      example: 'Metal',
    },
    provenance: { obj: [EdmObjectType.ProvidedCHO] },
    references: { obj: [EdmObjectType.ProvidedCHO] },
    replaces: { obj: [EdmObjectType.ProvidedCHO] },
    requires: { obj: [EdmObjectType.ProvidedCHO] },
    spatial: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Any,
    },
    tableOfContents: { obj: [EdmObjectType.ProvidedCHO] },
    temporal: { obj: [EdmObjectType.ProvidedCHO] },
  },
  edm: {
    aggregatedCHO: {
      val: EdmPropertyValueType.Reference,
      basic: false,
      obj: [EdmObjectType.Aggregation],
      // it is added by backend
      rec: Rec.None,
      max: Max.Single,
    },
    currentLocation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Single,
      example: 'http://sws.geonames.org/2950159',
    },
    dataProvider: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      lang: true,
      rec: Rec.Mandatory,
      max: Max.Single,
      example: 'Zuidwestbrabants Museum',
    },
    hasMet: { obj: [EdmObjectType.ProvidedCHO] },
    hasType: { obj: [EdmObjectType.ProvidedCHO] },
    hasView: { obj: [EdmObjectType.Aggregation] },
    incorporates: { obj: [EdmObjectType.ProvidedCHO] },
    intermediateProvider: { obj: [EdmObjectType.Aggregation] },
    isDerivativeOf: { obj: [EdmObjectType.ProvidedCHO] },
    isNextInSequence: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    isRelatedTo: { obj: [EdmObjectType.ProvidedCHO] },
    isRepresentationOf: { obj: [EdmObjectType.ProvidedCHO] },
    isShownAt: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.None,
      max: Max.Single,
    },
    isShownBy: {
      val: EdmPropertyValueType.Reference,
      obj: [EdmObjectType.Aggregation],
      // it is added by backend
      rec: Rec.None,
      max: Max.Single,
    },
    isSimilarTo: { obj: [EdmObjectType.ProvidedCHO] },
    isSuccessorOf: { obj: [EdmObjectType.ProvidedCHO] },
    object: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.None,
      max: Max.Single,
    },
    provider: {
      // TODO: VFS-11952 possible change in future from EU3D
      // Comment of EUreka3D:
      // In future this should be a limited list of values, BUT for the time being we
      // agreed to use "Photoconsortium" for all EUreka3D content. So we will not ask the
      // user for the time being (although alternatively we could use a combo box with
      // only one available option)
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.Mandatory,
      max: Max.Single,
      predef: [{
        label: 'Phoconsortium',
        value: 'Phoconsortium',
      }],
      def: 'Phoconsortium',
    },
    realizes: { obj: [EdmObjectType.ProvidedCHO] },
    rights: {
      basic: true,
      val: EdmPropertyValueType.Reference,
      obj: [EdmObjectType.Aggregation, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
      // Predefined values from
      // https://europeana.atlassian.net/wiki/spaces/EF/pages/1503756289/Providing+copyright+metadata+to+Europeana#Available-values
      predef: [
        // Creative Commons Licenses
        {
          label: 'CC BY 4.0',
          value: 'https://creativecommons.org/licenses/by/4.0/',
        },
        {
          label: 'CC BY-SA 4.0',
          value: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        {
          label: 'CC BY-ND 4.0',
          value: 'https://creativecommons.org/licenses/by-nd/4.0/',
        },
        {
          label: 'CC BY-NC 4.0',
          value: 'https://creativecommons.org/licenses/by-nc/4.0/',
        },
        {
          label: 'CC BY-NC-SA 4.0',
          value: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        },
        {
          label: 'CC BY-NC-ND 4.0',
          value: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
        },
        // Rights Statements provided by RightsStatements.org
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
          label: 'InC-EU-OW',
          value: 'http://rightsstatements.org/vocab/InC-OW-EU/1.0/',
        },
        {
          label: 'CNE',
          value: 'http://rightsstatements.org/vocab/CNE/1.0/',
        },
        // Creative Commons Public Domain Tools
        {
          label: 'CC0 1.0',
          value: 'https://creativecommons.org/publicdomain/zero/1.0/',
        },
        {
          label: 'PDM 1.0',
          value: 'https://creativecommons.org/publicdomain/mark/1.0/',
        },
      ],
    },
    type: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
    },
    ugc: { obj: [EdmObjectType.Aggregation] },
  },
  owl: {
    isSameAs: { obj: [EdmObjectType.ProvidedCHO] },
    sameAs: { obj: [EdmObjectType.WebResource] },
  },
});

function createSupportedTags() {
  const array = [];
  for (const namespace of Object.keys(allSpecs)) {
    for (const propertyName of Object.keys(allSpecs[namespace])) {
      array.push(`${namespace}:${propertyName}`);
    }
  }
  return array;
}

export const supportedPropertyTagSet = Object.freeze(new Set(createSupportedTags()));

function createAllPropertiesCreationData() {
  const items = [];
  for (const [namespace, namespaceSpecs] of Object.entries(allSpecs)) {
    for (const [name, spec] of Object.entries(namespaceSpecs)) {
      items.push(Object.freeze({
        name,
        namespace,
        xmlTagName: `${namespace}:${name}`,
        spec,
      }));
    }
  }
  return items;
}

/**
 * @type {Array<EdmPropertyCreationData>}
 */
export const allPropertyData = Object.freeze(createAllPropertiesCreationData());

/**
 * @type {Object<string, EdmPropertyCreationData>}
 */
export const tagToPropertyDataMap = _.zipObject(
  allPropertyData.map(p => p.xmlTagName),
  allPropertyData
);

function get3DFormats() {
  return [
    'IGES',
    'STL',
    '3MF  ',
    '3DMLW',
    '3DPDF',
    '3DS',
    'AC',
    'AMF',
    'PRC',
    'W3D',
    'GeoPDF',
    'ABC',
    'ASCII',
    'AN8',
    'APRX',
    'PLA',
    'PLN',
    'AOI',
    'ASM',
    'DWG',
    'MAX',
    'FBX',
    'MA',
    'MB',
    'BIM',
    'BLEND',
    'B3D',
    'MDX',
    'CSG',
    'Cal3D',
    'COB',
    'JAS',
    'C4D',
    'DAE',
    'CFL',
    'DPM',
    'DWF',
    'X',
    'MD5',
    'FACT',
    'PDF/E-1',
    'X3D',
    'FLS',
    'FWS',
    'NIF',
    'GML',
    'GeoTIFF',
    'GLM',
    'SKP',
    'KML/KMZ',
    'glTF',
    'IOB',
    'IFC',
    'IGES',
    'JT',
    'LXF',
    'E57',
    'LWO',
    'LWS',
    'LXO',
    'M3D',
    'MESH',
    'MM3D',
    'MPO',
    'BDL4',
    'BFRES',
    'BRRES',
    'BMD3',
    'NURBS',
    'NURMS',
    'OFF',
    'OpenGEX',
    '3DM',
    'CTM',
    'EGG',
    'Ptex',
    'PLY',
    'PTM',
    'POV-Ray',
    'PRT',
    'QGS',
    'MD2',
    'MD3',
    '3DMF',
    'R3D',
    'RTI',
    'DFF',
    'RWX',
    'RVT',
    'VIM',
    'SKP',
    'SLDASM',
    'SLDPRT',
    'STEP',
    'LAS',
    'DTS',
    'U3D',
    'USD',
    'USDC',
    'USDZ',
    'SMD',
    'VWX',
    'VRML',
    'MRC',
    'VRML97',
    'VUE',
    'OBJ',
    'WINGS',
    'CCP4',
    'XR',
    'XYZ',
    'ZFS',
    'ZFC',
    'Z3D',
  ];
}

export const langSelectorSpec = [
  { label: 'Default', value: '' },
  { label: 'Afrikaans', value: 'af' },
  { label: 'Amharic', value: 'am' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Mapudungun', value: 'arn' },
  { label: 'Assamese', value: 'as' },
  { label: 'Azerbaijani', value: 'az' },
  { label: 'Bashkir', value: 'ba' },
  { label: 'Belarusian', value: 'be' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Tibetan', value: 'bo' },
  { label: 'Breton', value: 'br' },
  { label: 'Bosnian', value: 'bs' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Corsican', value: 'co' },
  { label: 'Czech', value: 'cs' },
  { label: 'Welsh', value: 'cy' },
  { label: 'Danish', value: 'da' },
  { label: 'German', value: 'de' },
  { label: 'Lower Sorbian', value: 'dsb' },
  { label: 'Divehi', value: 'dv' },
  { label: 'Greek', value: 'el' },
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'Estonian', value: 'et' },
  { label: 'Basque', value: 'eu' },
  { label: 'Persian', value: 'fa' },
  { label: 'Finnish', value: 'fi' },
  { label: 'Filipino', value: 'fil' },
  { label: 'Faroese', value: 'fo' },
  { label: 'French', value: 'fr' },
  { label: 'Frisian', value: 'fy' },
  { label: 'Irish', value: 'ga' },
  { label: 'Scottish Gaelic', value: 'gd' },
  { label: 'Galician', value: 'gl' },
  { label: 'Swiss German', value: 'gsw' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Hausa', value: 'ha' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Serbo-Croatian', value: 'hrv' },
  { label: 'Upper Sorbian', value: 'hsb' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Armenian', value: 'hy' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Igbo', value: 'ig' },
  { label: 'Yi', value: 'ii' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Italian', value: 'it' },
  { label: 'Inuktitut', value: 'iu' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Georgian', value: 'ka' },
  { label: 'Kazakh', value: 'kk' },
  { label: 'Greenlandic', value: 'kl' },
  { label: 'Khmer', value: 'km' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Korean', value: 'ko' },
  { label: 'Konkani', value: 'kok' },
  { label: 'Kurdi', value: 'kb' },
  { label: 'Kyrgyz', value: 'ky' },
  { label: 'Luxembourgish', value: 'lb' },
  { label: 'Lao', value: 'lo' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Maori', value: 'mi' },
  { label: 'Macedonian', value: 'mk' },
  { label: 'Malayalam', value: 'ml' },
  { label: 'Mongolian', value: 'mn' },
  { label: 'Mohawk', value: 'moh' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Malay', value: 'ms' },
  { label: 'Maltese', value: 'mt' },
  { label: 'Burmese', value: 'my' },
  { label: 'Norwegian (Bokmål)', value: 'nb' },
  { label: 'Nepali', value: 'ne' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Norwegian (Nynorsk)', value: 'nn' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Occitan', value: 'oc' },
  { label: 'Odia', value: 'or' },
  { label: 'Punjabi', value: 'pa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Dari', value: 'prs' },
  { label: 'Pashto', value: 'ps' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'K\'iche', value: 'quc' },
  { label: 'Quechua', value: 'qu' },
  { label: 'Romansh', value: 'rm' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Kinyarwanda', value: 'rw' },
  { label: 'Sanskrit', value: 'sa' },
  { label: 'Yakut', value: 'sah' },
  { label: 'Sami (Northern)', value: 'se' },
  { label: 'Sinhala', value: 'si' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Sami (Southern)', value: 'sma' },
  { label: 'Sami (Lule)', value: 'smj' },
  { label: 'Sami (Inari)', value: 'smn' },
  { label: 'Sami (Skolt)', value: 'sms' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Sesotho', value: 'st' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Kiswahili', value: 'sw' },
  { label: 'Syriac', value: 'syc' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Telugu', value: 'te' },
  { label: 'Tajik', value: 'tg' },
  { label: 'Thai', value: 'th' },
  { label: 'Turkmen', value: 'tk' },
  { label: 'Tswana', value: 'tn' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Tatar', value: 'tt' },
  { label: 'Tamazight', value: 'tzm' },
  { label: 'Uyghur', value: 'ug' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Uzbek', value: 'uz' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Wolof', value: 'wo' },
  { label: 'Xhosa', value: 'xh' },
  { label: 'Yoruba', value: 'yo' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Zulu', value: 'zu' },
];
