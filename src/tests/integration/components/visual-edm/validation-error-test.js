import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EdmMetadataFactory from 'oneprovider-gui/utils/edm/metadata-factory';
import EdmPropertyFactory from 'oneprovider-gui/utils/edm/property-factory';
import EdmObjectType from 'oneprovider-gui/utils/edm/object-type';
import EdmObjectFactory from 'oneprovider-gui/utils/edm/object-factory';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';
import { makeAllPropertiesValid } from '../../../helpers/edm-utils';

describe('Integration | Component | visual-edm/validation-error', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.validator.destroy();
  });

  it('renders text about missing values of properties using object validator (XML)', async function () {
    this.metadata = new EdmMetadataFactory().createInitialMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory =
      new EdmPropertyFactory(this.metadata, EdmObjectType.ProvidedCHO);
    this.object = this.objectFactory.createInitialObject(EdmObjectType.ProvidedCHO);
    this.validator = EdmObjectValidator.create({ edmObject: this.object });
    this.viewType = 'xml';
    makeAllPropertiesValid(this.object);
    setValueByTag(this.object, 'dc:title', '');
    setValueByTag(this.object, 'dc:description', '');

    await renderComponent(this);

    expect(getElement().querySelector('.edm-info-row-text').textContent).to.contain(
      'properties dc:description and dc:title have empty values'
    );
  });

  it('renders text about missing values of properties using object validator (visual)', async function () {
    this.metadata = new EdmMetadataFactory().createInitialMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = new EdmPropertyFactory(
      this.metadata,
      EdmObjectType.ProvidedCHO
    );
    this.object = this.objectFactory.createInitialObject(EdmObjectType.ProvidedCHO);
    this.validator = EdmObjectValidator.create({ edmObject: this.object });
    this.viewType = 'visual';
    makeAllPropertiesValid(this.object);
    setValueByTag(this.object, 'dc:title', '');
    setValueByTag(this.object, 'dc:description', '');

    await renderComponent(this);

    expect(getElement().querySelector('.edm-info-row-text').textContent).to.contain(
      'properties "Title" and "Description/Caption" have empty values'
    );
  });
});

function setValueByTag(edmObject, xmlTagName, value) {
  edmObject.edmProperties.find(property => property.xmlTagName === xmlTagName)
    .setSupportedValue(value);
}

async function renderComponent() {
  await render(hbs`<VisualEdm::ValidationError
    @text="Validation test"
    @validator={{validator}}
    @viewType={{viewType}}
  />`);
}

function getElement() {
  return find('.visual-edm-validation-error');
}
