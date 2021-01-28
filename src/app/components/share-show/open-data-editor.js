/**
 * Open Data editor with visual (form) and XML (text) modes.
 *
 * @module components/share-show/open-data-editor
 * @author Jakub Liput
 * @copyright (C) 2021 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberObject, { get, set, computed, observer } from '@ember/object';
import dcXmlGenerator from 'oneprovider-gui/utils/dublin-core-xml-generator';
import dublinCoreXmlParser from 'oneprovider-gui/utils/dublin-core-xml-parser';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import plainCopy from 'onedata-gui-common/utils/plain-copy';
import { A } from '@ember/array';
import { dcElements } from 'oneprovider-gui/utils/dublin-core-xml-parser';
import _ from 'lodash';
import { isEmpty } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import OpenData from './-open-data';

export default OpenData.extend(I18n, {
  classNames: ['open-data-editor'],

  globalNotify: service(),

  /**
   * Initial values of: 'title', 'creator', 'description' and 'date' form fields.
   * See `#getInitialGroupedEntries()`.
   * @virtual optional
   * @type {Object}
   */
  initialData: Object.freeze({}),

  /**
   * @virtual
   * @type {Models.HandleService}
   */
  handleService: undefined,

  /**
   * @virtual
   * @type {(xml: String, handleServiceId: String) => Promise}
   */
  submit: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  updateXml: notImplementedIgnore,

  /**
   * Classname added to columns to center the form content, as it is too wide
   * @type {String}
   */
  colClassname: 'col-xs-12 col-md-8 col-centered',

  /**
   * Metadata group names that should be available in "add element" selector
   * @type {ComputedProperty<Array<String>>}
   */
  metadataGroupAddList: computed('groupedEntries.[]', function metadataGroupAddList() {
    const currentElements = this.get('groupedEntries').mapBy('type');
    return _.difference(dcElements, currentElements);
  }),

  /**
   * @type {ComputedProperty<Bolean>}
   */
  submitDisabled: isEmpty('handleService'),

  xmlObserver: observer('xml', function xmlObserver() {
    const xml = this.get('xml');
    if (xml != null) {
      const parser = dublinCoreXmlParser.create({
        xmlSource: xml,
        preserveEmptyValues: true,
      });
      this.set('groupedEntries', parser.getEmberGroupedEntries());
    }
  }),

  modeObserver: observer('mode', function modeObserver() {
    this.get('updateXml')(this.getXml());
  }),

  init() {
    this._super(...arguments);
    if (this.get('xml')) {
      this.xmlObserver();
    } else {
      this.set('groupedEntries', this.getInitialGroupedEntries());
    }
  },

  /**
   * Convert `initialData` to grouped entries format
   * @returns {EmberObject}
   */
  getInitialGroupedEntries() {
    const initialData = this.get('initialData');
    return A(['title', 'creator', 'description', 'date'].map(type => {
      const value = get(initialData, type);
      const values = [value];
      return EmberObject.create({
        type,
        values,
      });
    }));
  },

  /**
   * Convert form data to XML (Dublin Core)
   * @param {Boolean} deeplyCleaned if true, remove entries with blank string
   * @returns {String}
   */
  getXml(deeplyCleaned = false) {
    const generator = dcXmlGenerator.create({
      groupedEntries: plainCopy(this.get('groupedEntries')),
    });
    generator.cleanEmpty(deeplyCleaned);
    return get(generator, 'xml');
  },

  actions: {
    setValue(type, index, inputEvent) {
      const value = inputEvent.target.value;
      const group = this.get('groupedEntries').findBy('type', type);
      const values = get(group, 'values');
      set(values, String(index), value);
    },
    submit() {
      const {
        submit,
        updateXml,
        handleService,
        globalNotify,
      } = this.getProperties('submit', 'updateXml', 'handleService', 'globalNotify');
      const currentXml = this.getXml();
      updateXml(currentXml);
      return submit(currentXml, get(handleService, 'entityId'))
        .catch(error => {
          globalNotify.backendError(this.t('publishingData'), error);
          throw error;
        });
    },
    addEntry(type) {
      const group = this.get('groupedEntries').findBy('type', type);
      const values = get(group, 'values');
      values.pushObject('');
    },
    removeEntry(type, index) {
      const groupedEntries = this.get('groupedEntries');
      const group = groupedEntries.findBy('type', type);
      const newValues = get(group, 'values').toArray();
      newValues.splice(index, 1);
      if (get(newValues, 'length') === 0) {
        const groupIndex = groupedEntries.findIndex(entry => get(entry, 'type') === type);
        groupedEntries.removeAt(groupIndex);
      } else {
        set(group, 'values', A(newValues));
      }
    },
    addMetadataGroup(type) {
      this.get('groupedEntries').pushObject(EmberObject.create({
        type,
        values: [''],
      }));
    },
    back() {
      this.get('back')();
    },
  },
});
