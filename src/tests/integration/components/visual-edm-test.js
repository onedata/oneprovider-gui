import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

describe('Integration | Component | visual-edm', function () {
  setupRenderingTest();

  it('renders ProvidedCHO with some EDM properties with values in editor mode', async function () {
    const helper = new Helper(this);
    const factory = EdmMetadataFactory.create();
    const propertyFactory = EdmPropertyFactory.create();
    const metadata = factory.createEmptyMetadata();
    const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty(metadata, 'dc', 'contributor', {
          value: 'ERIAC',
          lang: 'en',
        }),
        propertyFactory.createProperty(metadata, 'dcterms', 'created', {
          value: '2018-03-13',
        }),
      ],
    });
    metadata.edmObjects = [providedCho];
    helper.visualEdmViewModel.set('isReadOnly', false);
    helper.visualEdmViewModel.set('edmMetadata', metadata);

    await helper.render();

    const propertyLabels = findAll('.edm-property-type').map(element => element.textContent.trim());
    expect(propertyLabels.includes('Contributor to the creation of the original object')).to.be.true;
    expect(propertyLabels.includes('Creation date of the original object')).to.be.true;

    const propertyValues = findAll('.edm-property-value input').map(element => element.value);
    expect(propertyValues.includes('ERIAC')).to.be.true;
    expect(propertyValues.includes('2018-03-13')).to.be.true;
  });

  it('renders ProvidedCHO with "about" and some EDM properties in readonly mode', async function () {
    const helper = new Helper(this);
    const factory = EdmMetadataFactory.create();
    const propertyFactory = EdmPropertyFactory.create();
    const metadata = factory.createEmptyMetadata();
    const resourceId = 'urn://eriac/19';
    const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
      attrs: {
        about: resourceId,
      },
      edmProperties: [
        propertyFactory.createProperty(metadata, 'dc', 'contributor', {
          value: 'ERIAC',
          lang: 'en',
        }),
        propertyFactory.createProperty(metadata, 'dcterms', 'created', {
          value: '2018-03-13',
        }),
      ],
    });
    metadata.edmObjects = [providedCho];
    helper.visualEdmViewModel.set('isReadOnly', true);
    helper.visualEdmViewModel.set('edmMetadata', metadata);

    await helper.render();

    const expectedStrings = [
      resourceId,
      'Contributor to the creation of the original object',
      'ERIAC',
      'Creation date of the original object',
      '2018-03-13',
    ];

    for (const expectedString of expectedStrings) {
      expect(helper.element.textContent).to.contain(expectedString);
    }
  });
});

class Helper {
  /**
   * @param {Mocha.Context} mochaContext
   */
  constructor(mochaContext) {
    this.mochaContext = mochaContext;
    this.visualEdmViewModel = VisualEdmViewModel.create();
  }
  /** @type {HTMLDivElement} */
  get element() {
    return find('.visual-edm');
  }
  async render() {
    this.mochaContext.setProperties({
      viewModel: this.visualEdmViewModel,
    });
    await render(hbs`<VisualEdm @viewModel={{viewModel}} />`);
  }
}
