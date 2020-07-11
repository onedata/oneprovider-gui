import { expect } from 'chai';
import { describe, it } from 'mocha';
import generateDcXml from 'oneprovider-gui/utils/generate-dc-xml';
import { get } from '@ember/object';

describe('Unit | Utility | generate dc xml', function () {
  it('generates XML using specified grouped entries', function () {
    const generator = generateDcXml.create({
      groupedEntries: [
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
      ],
    });

    const xml = get(generator, 'xml');
    expect(xml).to.contain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).to.contain(
      '<metadata xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dc="http://purl.org/dc/elements/1.1/">'
    );
    expect(xml).to.contain('<dc:title>White Noise Image Collection</dc:title>');
    expect(xml).to.contain('<dc:creator>Bartosz Kryza</dc:creator>');
    expect(xml).to.contain('<dc:subject>Demonstration</dc:subject>');
    expect(xml).to.contain(
      '<dc:description>This data set contains 10 images containing white noise, including script used to generate them.</dc:description>'
    );
    expect(xml).to.contain('<dc:date>2018-11-12</dc:date>');
    expect(xml).to.contain('<dc:language>PL</dc:language>');
    expect(xml).to.contain('<dc:language>EN</dc:language>');
    expect(xml).to.contain('<dc:format>PNG</dc:format>');
    expect(xml).to.contain('<dc:rights>CC-0</dc:rights>');
    expect(xml).to.contain('</metadata>');
  });

  it('can clean up empty entries from object', function () {
    const generator = generateDcXml.create({
      groupedEntries: [
        { type: 'title', values: ['', 'White Noise', '', ''] },
        { type: 'creator', values: [] },
        { type: 'subject', values: [''] },
      ],
    });

    generator.cleanEmpty();

    const entries = get(generator, 'entries');
    const groupedEntries = get(generator, 'groupedEntries');

    expect(entries).to.have.lengthOf(1);
    expect(entries[0]).to.deep.equal({ type: 'title', value: 'White Noise' });
    expect(groupedEntries).to.deep.equal([
      { type: 'title', values: ['White Noise'] },
    ]);
  });

  it('escapes unsafe values', function () {
    const generator = generateDcXml.create({
      groupedEntries: [
        { type: 'title', values: ['</dc:title>hello<dc:title>'] },
      ],
    });

    const xml = get(generator, 'xml');

    expect(xml).to.not.contain('<dc:title></dc:title>hello<dc:title></dc:title>');
    expect(xml).to.contain('&lt;/dc:title&gt;hello&lt;dc:title&gt;');
  });
});
