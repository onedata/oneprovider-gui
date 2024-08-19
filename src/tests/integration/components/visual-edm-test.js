import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find, findAll, fillIn, click, focus, blur } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import VisualEdmViewModel from 'oneprovider-gui/utils/visual-edm/view-model';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import { findByText } from '../../helpers/find';
import EdmMetadataValidator from 'oneprovider-gui/utils/edm/metadata-validator';
import { makeAllPropertiesValid } from '../../helpers/edm-utils';
import OneDropdownHelper from '../../helpers/one-dropdown';

describe('Integration | Component | visual-edm', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.helper?.destroy();
  });

  it('renders ProvidedCHO with some EDM properties with values in editor mode', async function () {
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    providedCho.edmProperties = [
      propertyFactory.createProperty('dc', 'contributor', {
        value: 'ERIAC',
        lang: 'en',
      }),
      propertyFactory.createProperty('dcterms', 'created', {
        value: '2018-03-13',
      }),
    ];
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    await helper.render();

    const propertyLabels = findAll('.edm-property-type-name')
      .map(element => element.textContent.trim());
    expect(propertyLabels).to.include('Contributor to the creation of the original object');
    expect(propertyLabels).to.include('Creation date of the original object');

    const propertyValues = findAll('.edm-property-value input').map(element => element.value);
    expect(propertyValues).to.include('ERIAC');
    expect(propertyValues).to.include('2018-03-13');
  });

  it('renders ProvidedCHO with some EDM properties in readonly mode', async function () {
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    const objectFactory = new EdmObjectFactory(metadata);
    const resourceId = 'urn://eriac/19';
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
      attrs: {
        about: resourceId,
      },
      edmProperties: [
        propertyFactory.createProperty('dc', 'contributor', {
          value: 'ERIAC',
          lang: 'en',
        }),
        propertyFactory.createProperty('dcterms', 'created', {
          value: '2018-03-13',
        }),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', true);

    await helper.render();

    const expectedStrings = [
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
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty('dc', 'title', {
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
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty('dc', 'contributor', {
          value: 'contributor name',
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
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(
        EdmObjectType.ProvidedCHO, {
          edmProperties: [
            propertyFactory.createProperty('dc', 'subject', {
              value: 'example value',
            }),
          ],
        }
      );
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
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(
        EdmObjectType.ProvidedCHO, {
          edmProperties: [
            propertyFactory.createProperty('dc', 'subject', {
              resource: 'http://example.com',
            }),
          ],
        }
      );
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
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(
        EdmObjectType.ProvidedCHO, {
          edmProperties: [
            propertyFactory.createProperty('dc', 'subject', {
              value: 'hello',
            }),
          ],
        }
      );
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
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
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
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(
        EdmObjectType.ProvidedCHO, {
          edmProperties: [
            propertyFactory.createProperty('dc', 'subject', {
              value: 'example value',
            }),
          ],
        }
      );
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      const langDropdown = new OneDropdownHelper('.edm-lang-dropdown-trigger');
      await langDropdown.selectOptionByText('Polish');

      // then
      expect(metadata.edmObjects[0].edmProperties[0].attrs.lang).to.equal('pl');
    }
  );

  it('lists properties in object in the predefined order', async function () {
    // given
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty('dc', 'description'),
        propertyFactory.createProperty('edm', 'type'),
        propertyFactory.createProperty('dc', 'title'),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', true);

    // when
    await helper.render();

    // then
    const propertyLabels = findAll('.edm-property-type-name').map(element =>
      element.textContent.trim()
    );
    const expectedPropertyLabels = [
      'Title',
      'Description/Caption',
      'Category',
    ];
    expect(propertyLabels).to.deep.equal(expectedPropertyLabels);
  });

  it('lists properties in the predefined order in add property selector',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      await click(helper.getObjectElement(0).querySelector('.add-edm-property-btn'));

      // then
      const propertyLabels = findAll('.add-property-selector li').map(element =>
        element.textContent.trim()
      );
      const expectedPropertyLabels = [
        'Title',
        'Description/Caption',
        'Category',
        'Subject',
        'Type of object',
        'Contributor to the creation of the original object',
        'Creator of the original object',
        'Creation date of the original object',
        'Language of inscriptions in the object',
        'Dimensions with units',
        'Parent entity (collection, object, site…)',
        'Material',
        'Original location',
        'Current location',
      ];
      expect(propertyLabels).to.deep.equal(expectedPropertyLabels);
    }
  );

  it('lists available specific properties for ProvidedCHO, Aggregation and WebResource',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
      const aggregation = objectFactory.createObject(EdmObjectType.Aggregation);
      const webResource = objectFactory.createObject(EdmObjectType.WebResource);
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
      expect(propertyLabels, 'ProvidedCHO')
        .to.include('Creator of the original object');
      expect(propertyLabels, 'ProvidedCHO').to.not.include('Creator of the model');
      expect(propertyLabels, 'ProvidedCHO')
        .to.include('Language of inscriptions in the object');
      expect(propertyLabels, 'ProvidedCHO')
        .to.not.include('Content provider institution');

      // when/then - WebResource
      propertyLabels = await getSelectorOptions(1);
      expect(propertyLabels, 'WebResource')
        .to.not.include('Creator of the original object');
      expect(propertyLabels, 'WebResource').to.include('Creator of the model');
      expect(propertyLabels, 'WebResource')
        .to.not.include('Language of inscriptions in the object');
      expect(propertyLabels, 'WebResource')
        .to.not.include('Content provider institution');

      // when/then - Aggregation
      propertyLabels = await getSelectorOptions(2);
      expect(propertyLabels, 'Aggregation').to.not.include('Creator of the model');
      expect(propertyLabels, 'Aggregation')
        .to.not.include('Creator of the original object');
      expect(propertyLabels, 'Aggregation')
        .to.not.include('Language of inscriptions in the object');
      expect(propertyLabels, 'Aggregation').to.include('Content provider institution');
    }
  );

  it('renders with initial objects with required properties when used with initial metadata',
    async function () {
      // given
      const helper = new Helper(
        this,
        EdmMetadataFactory.createInitialMetadata()
      );
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();

      // then
      expect(
        helper.element.querySelectorAll('.visual-edm-object')
      ).to.have.lengthOf(3);
      expect(
        helper.getObjectElement(0).querySelector('.edm-object-type').textContent.trim()
      ).to.equal('Cultural Heritage Object');
      expect(
        helper
        .getObjectElement(0)
        .querySelector('.edm-object-type-subtitle')
        .textContent
        .trim()
      ).to.equal(
        'This section contains information about the physical Cultural Heritage Object.'
      );
      expect(
        helper.getObjectElement(1).querySelector('.edm-object-type').textContent.trim()
      ).to.equal('Digital Object');
      expect(
        helper
        .getObjectElement(1)
        .querySelector('.edm-object-type-subtitle')
        .textContent
        .trim()
      ).to.equal(
        'This section contains information about the digital representation of the Cultural Heritage Object (e.g. the 3D model).'
      );
      expect(
        helper.getObjectElement(2).querySelector('.edm-object-type').textContent.trim()
      ).to.equal('Aggregation');
      expect(
        helper
        .getObjectElement(2)
        .querySelector('.edm-object-type-subtitle')
        .textContent
        .trim()
      ).to.equal(
        'This section contains aggregated information about all related resources pertaining to the Cultural Heritage Object.'
      );

      const choPropertyLabels = Array.from(
        helper.getObjectElement(0).querySelectorAll('.edm-property-type-name')
      ).map(element => element.textContent.trim());
      const expectedChoPropertyLabels = [
        'Title',
        'Description/Caption',
        'Category',
        'Subject',
        'Type of object',
        'Material',
      ];
      for (const label of expectedChoPropertyLabels) {
        expect(choPropertyLabels).to.include(label);
      }

      const wrPropertyLabels = Array.from(
        helper.getObjectElement(1).querySelectorAll('.edm-property-type-name')
      ).map(element => element.textContent.trim());
      const expectedWrPropertyLabels = [
        'Description of digital object',
      ];
      for (const label of expectedWrPropertyLabels) {
        expect(wrPropertyLabels).to.include(label);
      }

      const expectedAggregationPropertyLabels = [
        'Content provider institution',
        'Name of organisation uploading the data',
        'Copyright licence URL of the digital object',
      ];
      const aggregationPropertyLabels = Array.from(
        helper.getObjectElement(2).querySelectorAll('.edm-property-type-name')
      ).map(element => element.textContent.trim());
      for (const label of expectedAggregationPropertyLabels) {
        expect(aggregationPropertyLabels).to.include(label);
      }
    }
  );

  it('shows "required" label for property which recommendation is Required', async function () {
    // given
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty('dc', 'description'),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    // when
    await helper.render();

    // then
    expect(
      helper.getPropertyElement(0, 0).textContent
    ).to.contain('mandatory');
  });

  it('shows "optional" label for property which recommendation is None', async function () {
    // given
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty('dc', 'contributor'),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    // when
    await helper.render();

    // then
    expect(
      helper.getPropertyElement(0, 0).textContent
    ).to.contain('optional');
  });

  it('shows property already added with single max occurence as disabled in the add property selector',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const objectFactory = new EdmObjectFactory(metadata);
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
        edmProperties: [
          propertyFactory.createProperty('dc', 'type'),
        ],
      });
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      await click(helper.getObjectElement(0).querySelector('.add-edm-property-btn'));

      // then
      const titleSelectorItem = findByText('Type of object', '.add-property-selector li');
      expect(titleSelectorItem).to.have.class('disabled');
    }
  );

  it('shows property not yet added with single max occurence as not disabled in the add property selector',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO);
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      await click(helper.getObjectElement(0).querySelector('.add-edm-property-btn'));

      // then
      const titleSelectorItem = findByText('Title', '.add-property-selector li');
      expect(titleSelectorItem).to.not.have.class('disabled');
    }
  );

  it('has disabled delete button for mandatory property that has single instance',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
        edmProperties: [
          propertyFactory.createProperty('dc', 'description'),
        ],
      });
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      const deleteButton = helper.getPropertyElement(0, 0)
        .querySelector('.edm-delete-btn');
      await click(deleteButton);

      // then

      expect(deleteButton).to.have.class('disabled');
      expect(helper.getPropertyElement(0, 0)).to.exist;
    }
  );

  it('does not render lang input for some properties',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(
        EdmObjectType.ProvidedCHO, {
          edmProperties: [
            propertyFactory.createProperty('edm', 'type', {
              value: 'example value',
            }),
          ],
        }
      );
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();

      // then
      expect(find('.edm-property-lang-input')).to.not.exist;
    }
  );

  it('shows validation error on property value input if it is empty after input blur',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createEmptyMetadata();
      const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
      const objectFactory = new EdmObjectFactory(metadata);
      const providedCho = objectFactory.createObject(
        EdmObjectType.ProvidedCHO, {
          edmProperties: [
            propertyFactory.createProperty('dc', 'subject', {
              value: '',
            }),
          ],
        }
      );
      metadata.edmObjects = [providedCho];
      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      const edmPropertyValueInput = find('.edm-property-value input');
      await focus(edmPropertyValueInput);
      await blur(edmPropertyValueInput);

      // then
      expect(find('.edm-property-value .form-group')).to.have.class('has-error');
    }
  );

  it('shows validation error in object section if some property value is empty',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createInitialMetadata();
      for (const edmObject of metadata.edmObjects) {
        makeAllPropertiesValid(edmObject);
      }
      metadata
        .edmObjects[0]
        .edmProperties
        .find(property => property.edmPropertyType === 'title')
        .setSupportedValue('');

      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();

      // then
      const validationElement =
        helper.getObjectElement(0).querySelector('.visual-edm-validation-error');
      expect(validationElement).to.exist;
      expect(validationElement.textContent)
        .to.contain('property "Title" has empty value');
    }
  );

  it('shows empty property validation error in object section after new property is being added',
    async function () {
      // given
      const factory = EdmMetadataFactory;
      const metadata = factory.createInitialMetadata();
      for (const edmObject of metadata.edmObjects) {
        makeAllPropertiesValid(edmObject);
      }

      const helper = new Helper(this, metadata);
      helper.visualEdmViewModel.set('isReadOnly', false);

      // when
      await helper.render();
      await click(helper.getObjectElement(0).querySelector('.add-edm-property-btn'));
      await click(findByText('Creator of the original object', '.add-property-selector li'));

      // then
      const validationElement =
        helper.getObjectElement(0).querySelector('.visual-edm-validation-error');
      expect(validationElement).to.exist;
      expect(validationElement.textContent)
        .to.contain('property "Creator of the original object" has empty value');
    }
  );

  it('renders placeholder in empty input for property having placeholder example', async function () {
    const factory = EdmMetadataFactory;
    const metadata = factory.createEmptyMetadata();
    const propertyFactory = new EdmPropertyFactory(metadata, EdmObjectType.ProvidedCHO);
    const objectFactory = new EdmObjectFactory(metadata);
    const providedCho = objectFactory.createObject(EdmObjectType.ProvidedCHO, {
      edmProperties: [
        propertyFactory.createProperty('dc', 'type', {
          value: '',
          lang: '',
        }),
      ],
    });
    metadata.edmObjects = [providedCho];
    const helper = new Helper(this, metadata);
    helper.visualEdmViewModel.set('isReadOnly', false);

    await helper.render();
    /** @type {HTMLInputElement} */
    const propertyInput = find('.edm-property-value input');

    expect(propertyInput.placeholder).to.equal('Example: Musical instrument');
  });
});

class Helper {
  #visualEdmViewModel = undefined;

  /**
   * @param {Mocha.Context} mochaContext
   * @param {EdmMetadata} [edmMetadata]
   */
  constructor(mochaContext, edmMetadata) {
    this.mochaContext = mochaContext;
    this.visualEdmViewModel = VisualEdmViewModel.create({
      edmMetadata,
      validator: EdmMetadataValidator.create({
        edmMetadata,
      }),
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
  destroy() {
    this.visualEdmViewModel?.validator?.destroy();
    this.visualEdmViewModel?.destroy();
  }
}
