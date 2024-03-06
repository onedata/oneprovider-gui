import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

describe('Integration | Component | visual-edm', function () {
  setupRenderingTest();

  it('renders ProvidedCHO with "about" and some EDM properties', async function () {
    const helper = new Helper(this);
    const factory = EdmMetadataFactory.create();
    const metadata = factory.createEmptyMetadata();
    const resourceId = 'urn://eriac/19';
    const providedCho = factory.createObject(EdmObjectType.ProvidedCHO, {
      about: resourceId,
      edmProperties: [
        factory.createProperty(metadata, 'dc', 'contributor', {
          value: 'ERIAC',
          lang: 'en',
        }),
        factory.createProperty(metadata, 'dcterms', 'created', {
          value: '2018-03-13',
        }),
      ],
    });
    metadata.edmObjects.push(providedCho);
    helper.visualEdmViewModel.set('edmMetadata', metadata);

    await helper.render();

    const expectedStrings = [
      resourceId,
      'contributor',
      'ERIAC',
      'en',
      'created',
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
