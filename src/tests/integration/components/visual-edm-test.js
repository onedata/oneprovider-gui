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
      expect(metadata.edmObjects[0].edmProperties[0].attrs.resource).to.be.null;
    }
  );

  it('moves value to resource when type of value type is changed from "literal" to "reference"',
    async function () {
      // given
      const factory = EdmMetadataFactory.create();
      const propertyFactory = EdmPropertyFactory.create();
      const metadata = factory.createEmptyMetadata();
      const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
        edmProperties: [
          propertyFactory.createProperty(metadata, 'dc', 'subject', {
            value: 'hello',
          }),
        ],
      });
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      const edmPropertyValueInput = find('.edm-property-value input');
      await fillIn(edmPropertyValueInput, 'http://example.com');
      const valueTypeToggle = find('.edm-property-resource-toggle');
      await click(valueTypeToggle.querySelector('[data-value-type="reference"]'));

      // then
      expect(metadata.edmObjects[0].edmProperties[0].value, 'model value')
        .to.equal('');
      expect(metadata.edmObjects[0].edmProperties[0].attrs.resource, 'model resource')
        .to.equal('http://example.com');
      expect(find('.edm-property-value input').value, 'input')
        .to.equal('http://example.com');
    }
  );

  it('adds property to object using add property selector',
    async function () {
      // given
      const factory = EdmMetadataFactory.create();
      const metadata = factory.createEmptyMetadata();
      const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO);
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      await click(helper.getObjectElement(0).querySelector('.add-edm-property-btn'));
      await click('.add-property-selector li');

      // then
      expect(metadata.edmObjects[0].edmProperties, 'model properties')
        .to.have.lengthOf(1);
      expect(helper.getPropertyElement(0, 0)).to.exist;
    }
  );

  it('changes language attribute when changing language input',
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
      const edmPropertyLangInput = find('.edm-property-lang-input');

      await fillIn(edmPropertyLangInput, 'pl');

      // then
      expect(metadata.edmObjects[0].edmProperties[0].attrs.lang).to.equal('pl');
    }
  );

  it('adds WebResource object when clicking on "Add Web Resource" button', async function () {
    // given
    const factory = EdmMetadataFactory.create();
    const metadata = factory.createEmptyMetadata();
    const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {});
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    // when
    await helper.render();
    await click(helper.addWebResourceButton);

    // then
    expect(metadata.edmObjects).to.have.lengthOf(2);
    expect(helper.getObjectElement(1)).to.exist;
    expect(helper.getObjectElement(1).textContent).to.contain('Web Resource');
  });

  it('removes WebResource object when clicking on trash button in object', async function () {
    // given
    const factory = EdmMetadataFactory.create();
    const metadata = factory.createEmptyMetadata();
    const providedCHO = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {});
    const webResource1 = factory.createObject(metadata, EdmObjectType.WebResource, {});
    const webResource2 = factory.createObject(metadata, EdmObjectType.WebResource, {});
    metadata.edmObjects = [providedCHO, webResource1, webResource2];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    // when
    await helper.render();
    await click(helper.getObjectElement(1).querySelector('.edm-object-delete-btn'));

    // then
    expect(metadata.edmObjects).to.have.lengthOf(2);
    expect(helper.element.querySelectorAll('.visual-edm-object').length).to.equal(2);
  });

  it('lists properties in object in the predefined order', async function () {
    // given
    const factory = EdmMetadataFactory.create();
    const propertyFactory = EdmPropertyFactory.create();
    const metadata = factory.createEmptyMetadata();
    const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty(metadata, 'dcterms', 'issued'),
        propertyFactory.createProperty(metadata, 'dc', 'description'),
        propertyFactory.createProperty(metadata, 'dc', 'date'),
        propertyFactory.createProperty(metadata, 'edm', 'type'),
        propertyFactory.createProperty(metadata, 'dc', 'publisher'),
        propertyFactory.createProperty(metadata, 'dc', 'title'),
        propertyFactory.createProperty(metadata, 'dcterms', 'alternative'),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', true);

    // when
    await helper.render();

    // then
    const propertyLabels = findAll('.edm-property-type').map(element => element.textContent.trim());
    const expectedPropertyLabels = [
      'Title',
      'Description',
      'Asset type',
      'Date',
      'Publisher',
      'Alternative',
      'Issued',
    ];
    console.log(propertyLabels);
    console.log(expectedPropertyLabels);
    expect(propertyLabels).to.deep.equal(expectedPropertyLabels);
  });

  it('lists properties in the predefined order in add property selector',
    async function () {
      // given
      const factory = EdmMetadataFactory.create();
      const metadata = factory.createEmptyMetadata();
      const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO);
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      await click(helper.getObjectElement(0).querySelector('.add-edm-property-btn'));

      // then
      const propertyLabels = findAll('.add-property-selector li').map(element => element.textContent.trim());
      const expectedPropertyLabels = [
        'Title',
        'Description',
        'Asset type',
        'Subject',
        'Type of object',
        'Contributor to the creation of the original object',
        'Creator of the model',
        'Creation date of the original object',
        '3D format',
        'Internal ID',
        'Language of inscriptions in the object',
        'Dimensions with units',
        'Parent entity (collection, object, site…)',
        'Material',
        'Original location',
        'Current location',
        'Copyright',
        'URL for raw data',
        'URL for paradata',
        // FIXME: może dojdą property nie-predefiniowano-sortowane
      ];
      expect(propertyLabels).to.deep.equal(expectedPropertyLabels);
    }
  );

  it('lists available specific properties for ProvidedCHO, Aggregation and WebResource',
    async function () {
      // given
      const factory = EdmMetadataFactory.create();
      const metadata = factory.createEmptyMetadata();
      const providedCho = factory.createObject(metadata, EdmObjectType.ProvidedCHO);
      const aggregation = factory.createObject(metadata, EdmObjectType.Aggregation);
      const webResource = factory.createObject(metadata, EdmObjectType.WebResource);
      metadata.edmObjects = [providedCho, aggregation, webResource];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      let propertyLabels;
      await helper.render();
      const getSelectorOptions = async (objectIndex) => {
        await click(
          helper.getObjectElement(objectIndex).querySelector('.add-edm-property-btn')
        );
        const labels = findAll('.webui-popover-tags-selector.in li')
          .map(element => element.textContent.trim());
        await click(
          helper.getObjectElement(objectIndex).querySelector('.add-edm-property-btn')
        );
        return labels;
      };

      // when/then - ProvidedCHO
      propertyLabels = await getSelectorOptions(0);
      expect(propertyLabels, 'ProvidedCHO').to.include('Creator of the model');
      expect(propertyLabels, 'ProvidedCHO')
        .to.not.include('Creator of the original object');
      expect(propertyLabels, 'ProvidedCHO')
        .to.include('Language of inscriptions in the object');
      expect(propertyLabels, 'ProvidedCHO')
        .to.not.include('Content provider institution');

      // when/then - Aggregation
      propertyLabels = await getSelectorOptions(1);
      expect(propertyLabels, 'Aggregation').to.not.include('Creator of the model');
      expect(propertyLabels, 'Aggregation')
        .to.not.include('Creator of the original object');
      expect(propertyLabels, 'Aggregation')
        .to.not.include('Language of inscriptions in the object');
      expect(propertyLabels, 'Aggregation').to.include('Content provider institution');

      // when/then - WebResource
      propertyLabels = await getSelectorOptions(2);
      expect(propertyLabels, 'WebResource').to.not.include('Creator of the model');
      expect(propertyLabels, 'WebResource').to.include('Creator of the original object');
      expect(propertyLabels, 'WebResource')
        .to.not.include('Language of inscriptions in the object');
      expect(propertyLabels, 'WebResource')
        .to.not.include('Content provider institution');
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
  get addWebResourceButton() {
    return this.element.querySelector('.add-web-resource-btn');
  }
  async render() {
    this.mochaContext.setProperties({
      viewModel: this.visualEdmViewModel,
    });
    await render(hbs`<VisualEdm @viewModel={{viewModel}} />`);
  }
}
