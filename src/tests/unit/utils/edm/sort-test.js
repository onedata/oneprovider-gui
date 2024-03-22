import { expect } from 'chai';
import { describe, it } from 'mocha';
import { sortProperties, sortObjects } from 'oneprovider-gui/utils/edm/sort';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

describe('Unit | Utility | edm/sort', function () {
  it('sortProperties returns new array', function () {
    const title = { xmlTagName: 'dc:title' };
    const inputArray = [
      title,
    ];

    const result = sortProperties(inputArray);

    // checking the array reference, not contents
    expect(result).to.not.equal(inputArray);
  });

  it('sortProperties for visual sorts properties that has order defined', function () {
    const title = { xmlTagName: 'dc:title' };
    const description = { xmlTagName: 'dc:description' };
    const type = { xmlTagName: 'edm:type' };
    const inputArray = [
      description,
      type,
      title,
    ];

    const result = sortProperties(inputArray, 'visual');

    expect(result).to.deep.equal([
      title,
      description,
      type,
    ]);
  });

  it('sortProperties for visual puts properties with no order defined at the end of array sorted alphabetically by tag name',
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

      const result = sortProperties(inputArray, 'visual');

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

  it('sortObjects sorts objects using predefined order and alphabetically for unknown',
    function () {
      // ordered
      const aggregation = { xmlTagName: 'ore:Aggregation' };
      const providedCHO = { xmlTagName: 'edm:ProvidedCHO' };
      const webResource1 = { xmlTagName: 'edm:WebResource' };
      const webResource2 = { xmlTagName: 'edm:WebResource' };
      // non-ordered
      const service = { xmlTagName: 'svcs:Service' };
      const place = { xmlTagName: 'edm:Place' };
      const inputArray = [
        webResource1,
        aggregation,
        place,
        providedCHO,
        webResource2,
        service,
      ];

      const result = sortObjects(inputArray, 'visual');

      expect(result).to.deep.equal([
        // ordered
        providedCHO,
        aggregation,
        webResource1,
        webResource2,
        // non-ordered
        place,
        service,
      ]);
    }
  );
});
