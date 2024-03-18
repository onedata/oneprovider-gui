import { expect } from 'chai';
import { describe, it } from 'mocha';
import { sortProperties } from 'oneprovider-gui/utils/edm/sort';

describe('Unit | Utility | edm/sort', function () {
  it('returns new array', function () {
    const title = { xmlTagName: 'dc:title' };
    const inputArray = [
      title,
    ];

    const result = sortProperties(inputArray);

    // checking the array reference, not contents
    expect(result).to.not.equal(inputArray);
  });

  it('sorts properties that has order defined', function () {
    const title = { xmlTagName: 'dc:title' };
    const description = { xmlTagName: 'dc:description' };
    const type = { xmlTagName: 'edm:type' };
    const inputArray = [
      description,
      type,
      title,
    ];

    const result = sortProperties(inputArray);

    expect(result).to.deep.equal([
      title,
      description,
      type,
    ]);
  });

  it('puts properties with no order defined at the end of array sorted alphabetically by tag name',
    function () {
      // ordered
      const title = { xmlTagName: 'dc:title' };
      const description = { xmlTagName: 'dc:description' };
      const type = { xmlTagName: 'edm:type' };
      // non-ordered
      const alternative = { xmlTagName: 'dcterms:alternative' };
      const issued = { xmlTagName: 'dcterms:issued' };
      const date = { xmlTagName: 'dc:date' };
      const published = { xmlTagName: 'dc:published' };
      const inputArray = [
        issued,
        description,
        date,
        type,
        published,
        title,
        alternative,
      ];

      const result = sortProperties(inputArray);

      expect(result).to.deep.equal([
        // ordered
        title,
        description,
        type,
        // non-ordered
        date,
        published,
        alternative,
        issued,
      ]);
    }
  );
});
