/**
 * Dublin Core metadata editor with visual (form) and XML (text) modes.
 *
 * @author Jakub Liput
 * @copyright (C) 2021-2023 ACK CYFRONET AGH
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
import { isEmpty, array, or } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import Dc from './-dc';
import safeExec from 'onedata-gui-common/utils/safe-method-execution';

export default Dc.extend(I18n, {
  classNames: ['share-show-dc-editor', 'open-data-metadata-editor'],

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
  onSubmit: undefined,

  /**
   * @virtual
   * @type {() => void}
   */
  onBack: undefined,

  /**
   * @virtual
   * @type {Function}
   */
  onUpdateXml: notImplementedIgnore,

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
   * @type {ComputedProperty<Array<String>>}
   */
  metadataGroupAddListSorted: array.sort('metadataGroupAddList'),

  /**
   * @type {ComputedProperty<boolean>}
   */
  submitDisabled: or('parserError', isEmpty('handleService')),

  xmlObserver: observer('xml', function xmlObserver() {
    const xml = this.get('xml');
    if (xml != null) {
      const parser = dublinCoreXmlParser.create({
        xmlSource: xml,
        preserveEmptyValues: true,
      });
      this.setProperties({
        groupedEntries: parser.getEmberGroupedEntries(),
        parserError: get(parser, 'error'),
      });
    }
  }),

  modeObserver: observer('mode', function modeObserver() {
    // TODO: VFS-11646 Do replace the whole XML - replace only changed parts to not
    // destroy the unsupported parts of XML.
    this.onUpdateXml(this.getXml());
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
    async submit() {
      const currentXml = this.getXml();
      this.onUpdateXml(currentXml);
      this.set('formDisabled', true);
      try {
        await this.onSubmit(currentXml);
      } catch (error) {
        this.globalNotify.backendError(this.t('editor.publishingData'), error);
        throw error;
      } finally {
        safeExec(this, 'set', 'formDisabled', false);
      }
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
    // TODO: VFS-11645 Ask for unsaved changed when cancelling and chaning view
    back() {
      this.onBack();
    },
    updateXml(value) {
      this.onUpdateXml(value);
    },
  },
});
