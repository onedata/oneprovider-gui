import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';

describe('Unit | Utility | edm/metadata', function () {
  setupTest('util:edm/metadata', {});

  it('generates XML from empty EDM metadata model with supported namespaces',
    function () {
      // given
      const factory = EdmMetadataFactory.create();
      const metadataModel = factory.createEmptyMetadata();

      // when
      const resultXml = metadataModel.stringify();

      // then
      expect(resultXml).to.equal(
        `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:ore="http://www.openarchives.org/ore/terms/"/>`
      );
    }
  );
});
