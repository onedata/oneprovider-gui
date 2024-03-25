import EdmObjectType from './object-type';

// FIXME: typy obiektów mają być w enumie

/**
 * @typedef {'dc'|'dcterms'|'edm'|'owl'} EdmPropertyNamespace
 */

/**
 * @typedef {string} EdmPropertyName
 */

/**
 * @typedef {Object} EdmPropertySpec
 * @property {EdmPropertyValueType} val Type of data accepted of property - see
 *   `EdmPropertyValueType`.
 * @property {boolean} basic If true, then the property should be available to select to
 *   be added in the visual editor.
 * @property {Array} obj Types of EDM objects that can use this property.
 * @property {EdmPropertyRecommendation} rec Level of usage recommendation.
 * @property {EdmPropertyMaxOccurrences} max Level of property maximum occurrences in
 *   single EDM object.
 * @property {string} def Default value.
 */

export const EdmPropertyValueType = Object.freeze({
  Literal: 'literal',
  Reference: 'reference',
  Any: 'any',
});

export const EdmPropertyRecommendation = Object.freeze({
  Mandatory: 'mandatory',
  Recommended: 'recommended',
  None: 'none',
});

export const EdmPropertyMaxOccurrences = Object.freeze({
  Single: '1',
  Any: 'n',
});

const Rec = EdmPropertyRecommendation;
const Max = EdmPropertyMaxOccurrences;

export const allSpecs = Object.freeze({
  dc: {
    contributor: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Recommended,
      max: Max.Any,
    },
    coverage: { obj: [EdmObjectType.ProvidedCHO] },
    creator: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Recommended,
      max: Max.Any,
    },
    date: { obj: [EdmObjectType.ProvidedCHO] },
    description: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
      // FIXME: experimental - fill-in as in spreadsheet
      lang: true,
    },
    format: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      // FIXME: do finalnego ustalenia w spreadsheecie
      rec: Rec.Mandatory,
      max: Max.Single,
      predef: get3DFormats().map(formatLiteral => ({
        label: formatLiteral,
        value: formatLiteral,
      })),
    },
    identifier: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Single,
    },
    language: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Any,
    },
    publisher: { obj: [EdmObjectType.ProvidedCHO] },
    relation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
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
      rec: Rec.None,
      max: Max.Any,
    },
    source: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    subject: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
      lang: true,
    },
    title: {
      val: EdmPropertyValueType.Literal,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.Mandatory,
      max: Max.Single,
      lang: true,
    },
    type: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
      lang: true,
    },
  },
  dcterms: {
    alternative: { obj: [EdmObjectType.ProvidedCHO] },
    conformsTo: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    created: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.Recommended,
      max: {
        [EdmObjectType.ProvidedCHO]: Max.Any,
        [EdmObjectType.WebResource]: Max.Single,
      },
    },
    extent: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource],
      rec: Rec.None,
      max: Max.Any,
    },
    hasFormat: { obj: [EdmObjectType.ProvidedCHO] },
    hasPart: { obj: [EdmObjectType.ProvidedCHO, EdmObjectType.WebResource] },
    hasVersion: { obj: [EdmObjectType.ProvidedCHO] },
    isFormatOf: {
      val: EdmPropertyValueType.Reference,
      basic: true,
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
      rec: Rec.None,
      max: Max.Any,
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
    // FIXME: tego nie ma w standardzie EDM, ale jest w spreadsheecie
    currentLocation: {
      val: EdmPropertyValueType.Reference,
      basic: true,
      obj: [EdmObjectType.ProvidedCHO],
      rec: Rec.None,
      max: Max.Single,
    },
    dataProvider: {
      val: EdmPropertyValueType.Any,
      basic: true,
      obj: [EdmObjectType.Aggregation],
      rec: Rec.Mandatory,
      max: Max.Single,
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
      max: Max.Any,
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
      rec: Rec.Recommended,
      max: Max.Single,
    },
    provider: {
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
      obj: [EdmObjectType.Aggregation, EdmObjectType.WebResource],
      rec: Rec.Mandatory,
      max: Max.Single,
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

// FIXME: raczej powinno się zrobić speki w płaskiej liście i ew. potem robić z tego mapę pomocniczną (grupowaną)

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

function createFlatSpecs() {
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

export const flatSpecs = createFlatSpecs();

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
