import commonMockData from 'onedata-gui-common/utils/mock-data';

export const exampleMarkdownShort = commonMockData.exampleMarkdownShort;

export const exampleMarkdownLong = commonMockData.exampleMarkdownLong;

export const exampleDublinCore = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>White Noise Image Collection</dc:title>
  <dc:creator>Bartosz Kryza</dc:creator>
  <dc:creator></dc:creator>
  <dc:subject>Demonstration</dc:subject>
  <dc:description>This data set contains 10 images containing white noise, including script used to generate them.</dc:description>
  <dc:date>2018-11-12</dc:date>
  <dc:language>PL</dc:language>
  <dc:format>PNG</dc:format>
  <dc:rights>CC-0</dc:rights>
  <dc:language>EN</dc:language>
</metadata>`;

export const exampleEdmMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:edm="http://www.europeana.eu/schemas/edm/"
    xmlns:ore="http://www.openarchives.org/ore/terms/"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
>
    <edm:ProvidedCHO rdf:about="#exampleMet0">
        <dc:title>My share 1</dc:title>
        <dc:language>en</dc:language>
        <dc:type>dataset</dc:type>
        <edm:type>TEXT</edm:type>
        <dc:creator>Stub user</dc:creator>
        <dc:date>2023-12-20</dc:date>
    </edm:ProvidedCHO>
    <ore:Aggregation rdf:about="#exampleMet0_AGG">
        <edm:aggregatedCHO rdf:resource="#exampleMet0"/>
        <edm:dataProvider>Stub user</edm:dataProvider>
        <edm:isShownAt rdf:resource="https://onezone.local-onedata.org:9192/shares/share-space-0-1"/>
        <edm:provider>Stub user</edm:provider>
        <edm:rights rdf:resource="http://rightsstatements.org/vocab/NoC-OKLR/1.0/"/>
    </ore:Aggregation>
</rdf:RDF>`;

export const exampleDublinCoreShort = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>White Noise Image Collection</dc:title>
</metadata>`;

export const exampleDublinCoreLong = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>White Noise Image Collection</dc:title>
  <dc:creator>Bartosz Kryza</dc:creator>
  <dc:creator></dc:creator>
  <dc:subject>Demonstration</dc:subject>
  <dc:description>This data set contains 10 images containing white noise, including script used to generate them.</dc:description>
  <dc:description>Ullamco do non eiusmod cillum. Laborum incididunt aliqua pariatur ad Lorem amet consequat voluptate occaecat sint cillum aliqua ex pariatur. Dolor enim esse sit adipisicing laboris ad id occaecat sunt exercitation voluptate id nulla mollit.</dc:description>
  <dc:description>Mollit consequat amet ex deserunt mollit non minim do velit pariatur mollit. Deserunt magna fugiat laborum in. Amet cupidatat esse sunt ullamco tempor. Eu nulla in sint nisi excepteur est ad Lorem labore quis ipsum nostrud incididunt magna. Amet ea magna aliqua ut eu voluptate nisi cupidatat labore aute ullamco.</dc:description>
  <dc:date>2018-11-12</dc:date>
  <dc:language>PL</dc:language>
  <dc:format>PNG</dc:format>
  <dc:rights>CC-0</dc:rights>
  <dc:language>EN</dc:language>
</metadata>`;
