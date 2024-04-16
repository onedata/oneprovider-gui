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
// import { afterEach } from 'mocha';
import EdmObjectValidator from 'oneprovider-gui/utils/edm/object-validator';
import { makeAllPropertiesValid } from '../../../helpers/edm-utils';

describe('Integration | Component | visual-edm/validation-error', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.validator.destroy();
  });

  it('renders text about missing values of properties using object validator', async function () {
    this.metadata = EdmMetadataFactory.createInitialMetadata();
    this.objectFactory = new EdmObjectFactory(this.metadata);
    this.propertyFactory = new EdmPropertyFactory(this.metadata);
    this.object = this.objectFactory.createInitialObject(EdmObjectType.ProvidedCHO);
    this.validator = EdmObjectValidator.create({ edmObject: this.object });
    makeAllPropertiesValid(this.object);
    setValueByTag(this.object, 'dc:title', '');
    setValueByTag(this.object, 'dc:description', '');

    await renderComponent(this);

    expect(getElement().querySelector('.edm-info-row-text').textContent).to.contain(
      'properties dc:title and dc:description have empty values'
    );
  });
});

function setValueByTag(edmObject, xmlTagName, value) {
  edmObject.edmProperties.find(property => property.xmlTagName === xmlTagName)
    .setSupportedValue(value);
}

async function renderComponent(mochaContext) {
  mochaContext.set('validator', mochaContext.validator);
  await render(hbs`<VisualEdm::ValidationError
    @text="Validation test"
    @validator={{validator}}
  />`);
}

function getElement() {
  return find('.visual-edm-validation-error');
}
