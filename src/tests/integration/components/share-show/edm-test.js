import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, click, blur, focus, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { replaceEmberAceWithTextarea } from '../../../helpers/ember-ace';

describe('Integration | Component | share-show/edm', function () {
  setupRenderingTest();

  beforeEach(function () {
    replaceEmberAceWithTextarea(this);
  });

  it('renders visual metadata representation if xmlValue is provided',
    async function () {
      // given
      const helper = new Helper(this);
      helper.xmlValue = generateExampleXmls().helloWorldTitle;
      helper.readonly = true;

      // when
      await helper.render();

      // then
      expect(helper.element.querySelector('.edm-property-value')?.textContent)
        .to.contain('Hello world');
    }
  );

  it('renders XML source generated from model in ACE editor when switching to XML editor',
    async function () {
      // given
      const helper = new Helper(this);
      helper.xmlValue = generateExampleXmls().helloWorldTitle;
      helper.readonly = true;

      // when
      await helper.render();
      await click(helper.xmlEditorButton);

      // then
      const fragments = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rdf:RDF',
        'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
        '<edm:ProvidedCHO>',
        '<dc:title>',
        'Hello world',
      ];
      const resultXml = helper.xmlSourceText;
      for (const fragment of fragments) {
        expect(resultXml).to.contain(fragment);
      }
    }
  );

  it('shows validation error on visual empty property value after switching modes',
    async function () {
      // given
      const helper = new Helper(this);
      helper.xmlValue = generateExampleXmls().emptyTitle;
      helper.readonly = false;

      // when
      await helper.render();
      const getValueInput = () =>
        helper.element.querySelector('.edm-property-value input');
      const getValueFormGroup = () =>
        helper.element.querySelector('.edm-property-value .form-group');

      await focus(getValueInput());
      await blur(getValueInput());
      await click(helper.xmlEditorButton);
      await click(helper.visualEditorButton);
      await focus(getValueInput());
      await blur(getValueInput());

      // then
      expect(getValueFormGroup()).to.have.class('has-error');
    }
  );

  it('renders open data logo in readonly mode if representative image is not provided',
    async function () {
      // given
      const helper = new Helper(this);
      helper.xmlValue = generateExampleXmls().helloWorldTitle;
      helper.readonly = true;

      // when
      await helper.render();

      // then
      expect(helper.element.querySelector('.open-data-logo')).to.exist;
    }
  );

  it('renders representative image in column if it is provided',
    async function () {
      // given
      const helper = new Helper(this);
      helper.xmlValue = generateExampleXmls().withImage;
      helper.readonly = true;

      // when
      await helper.render();
      // wait for image to load
      await settled();

      // then
      expect(
        helper.element.querySelector('.representative-image-container img')
        .getAttribute('src')
      ).to.equal('/assets/images/oneprovider-logo.svg');
    }
  );

  it('renders image not found block in column if it cannot be loaded',
    async function () {
      // given
      const helper = new Helper(this);
      helper.xmlValue = generateExampleXmls().withInvalidImage;
      helper.readonly = true;

      // when
      await helper.render();
      // wait for image to load (fail to load)
      await settled();

      // then
      expect(
        helper.element.querySelector('.representative-image-container img')
      ).to.not.exist;
      expect(
        helper.element.querySelector('.representative-image-container').textContent
      ).to.contain('Image not found');
    }
  );
});

class Helper {
  /** @type {string} */
  xmlValue = undefined;
  /** @type {boolean} */
  readonly = false;

  constructor(mochaContext) {
    /** @type {Mocha.Context} */
    this.mochaContext = mochaContext;
  }
  get element() {
    return find('.share-show-edm');
  }
  get xmlEditorButton() {
    return this.element.querySelector('.btn-xml-editor');
  }
  get visualEditorButton() {
    return this.element.querySelector('.btn-visual-editor');
  }
  get xmlSourceText() {
    return this.element.querySelector('.ember-ace-edm-source textarea').value;
  }
  async render() {
    this.mochaContext.setProperties({
      xmlValue: this.xmlValue,
      // using _readonly because readonly is reserved in Mocha
      _readonly: this.readonly,
    });
    await render(hbs`<ShareShow::Edm @xmlValue={{xmlValue}} @readonly={{_readonly}} />`);
  }
}

function generateExampleXmls() {
  return {
    helloWorldTitle: `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
  <edm:ProvidedCHO>
    <dc:title>Hello world</dc:title>
  </edm:ProvidedCHO>
</rdf:RDF>`,
    emptyTitle: `<?xml version="1.0" encoding="UTF-8"?>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
      <edm:ProvidedCHO>
        <dc:title></dc:title>
      </edm:ProvidedCHO>
    </rdf:RDF>`,
    withImage: `<?xml version="1.0" encoding="UTF-8"?>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
      <edm:ProvidedCHO>
        <dc:title>Hello world</dc:title>
      </edm:ProvidedCHO>
      <ore:Aggregation>
        <edm:object rdf:resource="/assets/images/oneprovider-logo.svg"/>
      </ore:Aggregation>
    </rdf:RDF>`,
    withInvalidImage: `<?xml version="1.0" encoding="UTF-8"?>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:edm="http://www.europeana.eu/schemas/edm/" xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#" xmlns:ore="http://www.openarchives.org/ore/terms/" xmlns:owl="http://www.w3.org/2002/07/owl#" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dcterms="http://purl.org/dc/terms/">
      <edm:ProvidedCHO>
        <dc:title>Hello world</dc:title>
      </edm:ProvidedCHO>
      <ore:Aggregation>
        <edm:object rdf:resource="not-existing.svg"/>
      </ore:Aggregation>
    </rdf:RDF>`,
  };
}
