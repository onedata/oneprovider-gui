import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, fillIn, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm-view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';

describe('Integration | Component | visual-edm', function () {
  setupRenderingTest();

  it('renders ProvidedCHO with some EDM properties with values in editor mode', async function () {
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
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    await helper.render();

    const propertyLabels = findAll('.edm-property-type').map(element => element.textContent.trim());
    expect(propertyLabels).to.include('Contributor to the creation of the original object');
    expect(propertyLabels).to.include('Creation date of the original object');

    const propertyValues = findAll('.edm-property-value input').map(element => element.value);
    expect(propertyValues).to.include('ERIAC');
    expect(propertyValues).to.include('2018-03-13');
  });

  it('renders ProvidedCHO with "about" and some EDM properties in readonly mode', async function () {
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
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', true);

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

  it('changes model and input value when input value is changed', async function () {
    // given
    const factory = EdmMetadataFactory.create();
    const propertyFactory = EdmPropertyFactory.create();
    const metadata = factory.createEmptyMetadata();
    const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty(metadata, 'dc', 'title', {
          value: 'initial title',
        }),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    // when
    await helper.render();
    const edmPropertyValueInput = find('.edm-property-value input');
    await fillIn(edmPropertyValueInput, 'new title');

    // then
    expect(metadata.edmObjects[0].edmProperties[0].value).to.equal('new title');
    expect(edmPropertyValueInput.value).to.equal('new title');
  });

  it('removes property from model and view when delete icon is clicked', async function () {
    // given
    const factory = EdmMetadataFactory.create();
    const propertyFactory = EdmPropertyFactory.create();
    const metadata = factory.createEmptyMetadata();
    const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty(metadata, 'dc', 'title', {
          value: 'initial title',
        }),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    // when
    await helper.render();
    await click(helper.getPropertyElement(0, 0).querySelector('.edm-delete-btn'));

    // then
    expect(metadata.edmObjects[0].edmProperties).to.have.lengthOf(0);
    expect(helper.getPropertyElement(0, 0)).to.not.exist;
  });

  it('changes model "value" and "resource" when type of value is changed to "reference" and filled',
    async function () {
      // given
      const factory = EdmMetadataFactory.create();
      const propertyFactory = EdmPropertyFactory.create();
      const metadata = factory.createEmptyMetadata();
      const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
        edmProperties: [
          propertyFactory.createProperty(metadata, 'dc', 'subject', {
            value: 'example value',
          }),
        ],
      });
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      const valueTypeToggle = find('.edm-property-resource-toggle');
      await click(valueTypeToggle.querySelector('[data-value-type="reference"]'));
      const edmPropertyValueInput = find('.edm-property-value input');

      await fillIn(edmPropertyValueInput, 'http://example.com');

      // then
      expect(metadata.edmObjects[0].edmProperties[0].attrs.resource)
        .to.equal('http://example.com');
      expect(metadata.edmObjects[0].edmProperties[0].value).to.be.empty;
    }
  );

  it('changes model "value" and "resource" when type of value is changed to "value" and filled',
    async function () {
      // given
      const factory = EdmMetadataFactory.create();
      const propertyFactory = EdmPropertyFactory.create();
      const metadata = factory.createEmptyMetadata();
      const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
        edmProperties: [
          propertyFactory.createProperty(metadata, 'dc', 'subject', {
            resource: 'http://example.com',
          }),
        ],
      });
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      const valueTypeToggle = find('.edm-property-resource-toggle');
      await click(valueTypeToggle.querySelector('[data-value-type="literal"]'));
      const edmPropertyValueInput = find('.edm-property-value input');

      await fillIn(edmPropertyValueInput, 'example value');

      // then
      expect(metadata.edmObjects[0].edmProperties[0].value).to.be.equal('example value');
      expect(metadata.edmObjects[0].edmProperties[0].attrs.resource).to.be.empty;
    }
  );

  // FIXME: zmiana value type dla pustego

  // FIXME:
  it('moved value to resource when type of value type is changed from "literal" to "reference"',
    async function () {
      // given
      const helper = new Helper(this);
      const factory = EdmMetadataFactory.create();
      const propertyFactory = EdmPropertyFactory.create();
      const metadata = factory.createEmptyMetadata();
      const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
        edmProperties: [
          propertyFactory.createProperty(metadata, 'dc', 'subject', {
            value: 'http://example.com',
          }),
        ],
      });
      metadata.edmObjects = [providedCho];
      helper.visualEdmViewModel.set('isReadOnly', false);
      helper.visualEdmViewModel.set('edmMetadata', metadata);

      // when
      await helper.render();
      const valueTypeToggle = find('.edm-property-resource-toggle');
      await click(valueTypeToggle.querySelector('[data-value-type="reference"]'));

      // then
      expect(metadata.edmObjects[0].edmProperties[0].attrs.resource)
        .to.equal('http://example.com');
      expect(find('.edm-property-value input').value).to.equal('http://example.com');
    }
  );
});

class Helper {
  #visualEdmViewModel = undefined;

  /**
   * @param {Mocha.Context} mochaContext
   * @param {EdmMetadata} edmMetadata
   */
  constructor(mochaContext, edmMetadata) {
    this.mochaContext = mochaContext;
    this.visualEdmViewModel = VisualEdmViewModel.create({
      edmMetadata,
    });
  }
  /** @type {HTMLDivElement} */
  get element() {
    return find('.visual-edm');
  }
  /**
   * @param {number} index
   * @returns {HTMLDivElement}
   */
  getObjectElement(index) {
    return this.element.querySelectorAll('.visual-edm-object')[index];
  }
  getPropertyElement(objectIndex, propertyIndex) {
    return this
      .getObjectElement(objectIndex)
      .querySelectorAll('.visual-edm-property')[propertyIndex];
  }
  get visualEdmViewModel() {
    if (!this.#visualEdmViewModel) {
      this.#visualEdmViewModel = VisualEdmViewModel.create();
    }
    return this.#visualEdmViewModel;
  }
  set visualEdmViewModel(value) {
    this.#visualEdmViewModel = value;
  }
  async render() {
    this.mochaContext.setProperties({
      viewModel: this.visualEdmViewModel,
    });
    await render(hbs`<VisualEdm @viewModel={{viewModel}} />`);
  }
}
