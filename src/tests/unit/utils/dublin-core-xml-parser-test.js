import { expect } from 'chai';
import { describe, it } from 'mocha';
import DcXmlParser from 'oneprovider-gui/utils/dublin-core-xml-parser';
import { get } from '@ember/object';

/* eslint-disable max-len */

const xmlOnedataLegacy = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>White Noise Image Collection</dc:title>
  <dc:creator>Bartosz Kryza</dc:creator>
  <dc:subject>Demonstration</dc:subject>
  <dc:description>This data set contains 10 images containing white noise, including script used to generate them.</dc:description>
  <dc:date>2018-11-12</dc:date>
  <dc:language>PL</dc:language>
  <dc:format>PNG</dc:format>
  <dc:rights>CC-0</dc:rights>
  <dc:language>EN</dc:language>
</metadata>`;

const xmlWithEmptyElements = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>Test</dc:title>
  <dc:title></dc:title>
</metadata>`;

/* eslint-enable max-len */

describe('Unit | Utility | dublin core xml parser', function () {
  it('parses example XML metadata used in old Onedata releases', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlOnedataLegacy });
    const entries = get(parser, 'entries');

    expect(entries).to.have.lengthOf(9);
    expect(entries.findBy('type', 'title'))
      .to.have.property('value', 'White Noise Image Collection');
    expect(entries.findBy('type', 'creator'))
      .to.have.property('value', 'Bartosz Kryza');
    const languageEntries = entries.filterBy('type', 'language');
    expect(languageEntries).to.have.lengthOf(2);
    expect(languageEntries[0]).to.have.property('value', 'PL');
    expect(languageEntries[1]).to.have.property('value', 'EN');
  });

  it('parses XML with empty values and ignores them by default', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlWithEmptyElements });
    const entries = get(parser, 'entries');

    expect(entries).to.have.lengthOf(1);
    expect(entries.findBy('type', 'title'))
      .to.have.property('value', 'Test');
  });

  it('parses XML with empty values and exposes them using special flag', function () {
    const parser = DcXmlParser.create({
      xmlSource: xmlWithEmptyElements,
      preserveEmptyValues: true,
    });
    const entries = get(parser, 'entries');

    expect(entries).to.have.lengthOf(2);
    const titles = entries.filterBy('type', 'title');
    expect(titles[0]).to.have.property('value', 'Test');
    expect(titles[1]).to.have.property('value', '');
  });

  it('exposes grouped metadata entries in correct order', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlOnedataLegacy });
    const groupedEntries = get(parser, 'groupedEntries');

    expect(groupedEntries).to.deep.equal([
      { type: 'title', values: ['White Noise Image Collection'] },
      { type: 'creator', values: ['Bartosz Kryza'] },
      { type: 'subject', values: ['Demonstration'] },
      {
        type: 'description',
        values: [
          'This data set contains 10 images containing white noise, including script used to generate them.',
        ],
      },
      { type: 'date', values: ['2018-11-12'] },
      { type: 'language', values: ['PL', 'EN'] },
      { type: 'format', values: ['PNG'] },
      { type: 'rights', values: ['CC-0'] },
    ]);
  });

  // TODO: VFS-6566 should pass below tests to support on-line generated

  // it('parses XML generated with online generator with multiple nodes of the same type',
  //   function () {
  //     const result = DcXmlParser.create({ xmlSource: p });
  //     const entries = get(result, 'entries');

  //     const xmlDoc = get(result, 'xmlDoc');
  //     console.log(Array.from(xmlDoc.querySelectorAll('title')));

  //     expect(entries).to.have.lengthOf(9);
  //     const publishers = entries.filterBy('type', 'publisher');
  //     const languages = entries.filterBy('type', 'language');
  //     expect(publishers).to.have.lengthOf(2);
  //     expect(languages).to.have.lengthOf(3);
  //     const languageValues = languages.mapBy('value');
  //     expect(languageValues).to.contain('PL');
  //     expect(languageValues).to.contain('EN');
  //     expect(languageValues).to.contain('SK');
  //   }
  // );

  // TODO: VFS-6566 should pass below tests to support malformed XMLs

  // it('parses example XML metadata without namespace', function () {
  //   const result = DcXmlParser.create({ xmlSource: xmlWithoutNamespace });
  //   const entries = get(result, 'entries');
  //   expect(entries).to.have.lengthOf(2);
  //   expect(entries.findBy('type', 'title'))
  //     .to.have.property('value', 'White Noise Image Collection');
  //   expect(entries.findBy('type', 'creator'))
  //     .to.have.property('value', 'Bartosz Kryza');
  // });
});
