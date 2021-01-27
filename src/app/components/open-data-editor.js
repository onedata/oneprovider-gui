// FIXME: jsdoc

import Component from '@ember/component';
import EmberObject, { get, set, computed, observer } from '@ember/object';
import dcXmlGenerator from 'oneprovider-gui/utils/generate-dc-xml';
import dcXmlParser from 'oneprovider-gui/utils/parse-dc-xml';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import plainCopy from 'onedata-gui-common/utils/plain-copy';
import { A } from '@ember/array';
import { dcElements } from 'oneprovider-gui/utils/parse-dc-xml';
import _ from 'lodash';
import { isEmpty } from 'ember-awesome-macros';
import notImplementedIgnore from 'onedata-gui-common/utils/not-implemented-ignore';
import { inject as service } from '@ember/service';
import scrollTopClosest from 'onedata-gui-common/utils/scroll-top-closest';

const defaultMode = 'visual';

export default Component.extend(I18n, {
  classNames: ['open-data-preview', 'open-data-editor', 'open-data-view'],

  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.openDataPreview',

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
   * @type {String}
   */
  xml: undefined,

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
   * One of: visual, xml
   * @type {String}
   */
  mode: defaultMode,

  /**
   * For format reference see `util:generate-dc-xml#groupedEntries`.
   * @type {Array<{ type: String, value: String }>}
   */
  groupedEntries: undefined,

  /**
   * Classname added to columns to center the form content, as it is too wide
   * @type {String}
   */
  colClassname: 'col-xs-12 col-md-8 col-centered',

  init() {
    this._super(...arguments);
    if (this.get('xml')) {
      this.xmlObserver();
    } else {
      this.set('groupedEntries', this.getInitialGroupedEntries());
    }
  },

  changeEditorMode(mode) {
    this.set('mode', mode);
  },

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

  getXml(deeplyCleaned = false) {
    const generator = dcXmlGenerator.create({
      groupedEntries: plainCopy(this.get('groupedEntries')),
    });
    generator.cleanEmpty(deeplyCleaned);
    return get(generator, 'xml');
  },

  xmlObserver: observer('xml', function xmlObserver() {
    const xml = this.get('xml');
    if (xml != null) {
      const parser = dcXmlParser.create({
        xmlSource: xml,
        preserveEmptyValues: true,
      });
      this.set('groupedEntries', parser.getEmberGroupedEntries());
    }
  }),

  // FIXME: in common open-data component
  modeObserver: observer('mode', function modeObserver() {
    const {
      updateXml,
      element,
    } = this.getProperties('updateXml', 'element');
    updateXml(this.getXml());
    scrollTopClosest(element);
  }),

  metadataGroupAddList: computed('groupedEntries.[]', function metadataGroupAddList() {
    const currentElements = this.get('groupedEntries').mapBy('type');
    return _.difference(dcElements, currentElements);
  }),

  submitDisabled: isEmpty('handleService'),

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
    simpleMatcher(name, term) {
      return name.toLocaleLowerCase().includes(term.toLocaleLowerCase()) ? 1 : -1;
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
