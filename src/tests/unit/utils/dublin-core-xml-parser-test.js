import { expect } from 'chai';
import { describe, it } from 'mocha';
import DcXmlParser from 'oneprovider-gui/utils/dublin-core-xml-parser';
import { get, set } from '@ember/object';

const xmlFromOnedataExample = `<?xml version="1.0" encoding="UTF-8"?>
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

const xmlWithComment = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title><!-- foo -->Test</dc:title>
</metadata>`;

const xmlWithWhitespaces = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>  Test   </dc:title>
</metadata>`;

const xmlWithNonTextElements = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:title>Test</dc:title>
  <dc:title><hello>One</hello></dc:title>
</metadata>`;

const xmlMultiple = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:language>PL</dc:language>
  <dc:language>EN</dc:language>
  <dc:language>SK</dc:language>
</metadata>`;

const xmlWithUnknownTypes = `<?xml version="1.0" encoding="UTF-8"?>
<metadata
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <dc:foo>Hello</dc:foo>
</metadata>`;

const xmlWithoutNamespace = '<dc:title>hello</dc:title>';

describe('Unit | Utility | dublin-core-xml-parser', function () {
  it('parses example XML metadata used in Onedata real-life scenario', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlFromOnedataExample });
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

  it('parses XML with empty values and exposes them when using "preserveEmptyValues" flag', function () {
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

  it('parses XML with non-text-node values and exposes them as empty when using "preserveEmptyValues" flag',
    function () {
      const parser = DcXmlParser.create({
        xmlSource: xmlWithNonTextElements,
        preserveEmptyValues: true,
      });
      const entries = get(parser, 'entries');

      expect(entries).to.have.lengthOf(2);
      const titles = entries.filterBy('type', 'title');
      expect(titles[0]).to.have.property('value', 'Test');
      expect(titles[1]).to.have.property('value', '');
    }
  );

  it('parses XML with XML comment inside values',
    function () {
      const parser = DcXmlParser.create({
        xmlSource: xmlWithComment,
        preserveEmptyValues: true,
      });
      const entries = get(parser, 'entries');

      expect(entries).to.have.lengthOf(1);
      const titles = entries.filterBy('type', 'title');
      expect(titles[0]).to.have.property('value', 'Test');
    }
  );

  it('ignores element types not from Dublin Core version 1.1',
    function () {
      const parser = DcXmlParser.create({
        xmlSource: xmlWithUnknownTypes,
      });
      const entries = get(parser, 'entries');

      expect(entries).to.have.lengthOf(0);
    }
  );

  it('trims whitespaces inside parsed XML values',
    function () {
      const parser = DcXmlParser.create({
        xmlSource: xmlWithWhitespaces,
        preserveEmptyValues: true,
      });
      const entries = get(parser, 'entries');

      expect(entries).to.have.lengthOf(1);
      const titles = entries.filterBy('type', 'title');
      expect(titles[0]).to.have.property('value', 'Test');
    }
  );

  it('exposes grouped metadata entries in correct order', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlFromOnedataExample });
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

  it('parses XML generated with online generator with multiple nodes of the same type', function () {
    const result = DcXmlParser.create({ xmlSource: xmlMultiple });
    const entries = get(result, 'entries');

    expect(entries).to.have.lengthOf(3);
    const languages = entries.filterBy('type', 'language');
    const languageValues = languages.mapBy('value');
    expect(languageValues).to.contain('PL');
    expect(languageValues).to.contain('EN');
    expect(languageValues).to.contain('SK');
  });

  it('holds null error message when XML is not provided', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlWithoutNamespace });
    set(parser, 'xmlSource', xmlFromOnedataExample);

    expect(get(parser, 'error')).to.be.null;
  });

  it('holds error message and empty entries when XML parsing fails', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlWithoutNamespace });

    expect(get(parser, 'entries')).to.have.lengthOf(0);
    expect(get(parser, 'error')).to.be.not.empty.string;
  });

  it('holds null error message when XML is valid', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlFromOnedataExample });

    expect(get(parser, 'error')).to.be.null;
  });

  it('holds null error message after XML is replaced by valid one', function () {
    const parser = DcXmlParser.create({ xmlSource: xmlWithoutNamespace });
    set(parser, 'xmlSource', xmlFromOnedataExample);

    expect(get(parser, 'error')).to.be.null;
  });
});
