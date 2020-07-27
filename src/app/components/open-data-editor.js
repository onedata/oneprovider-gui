import Component from '@ember/component';
import EmberObject, { get, set, computed } from '@ember/object';
import dcXmlGenerator from 'oneprovider-gui/utils/generate-dc-xml';
import dcXmlParser from 'oneprovider-gui/utils/parse-dc-xml';
import I18n from 'onedata-gui-common/mixins/components/i18n';
import plainCopy from 'onedata-gui-common/utils/plain-copy';
import { observer } from '@ember/object';
import { A } from '@ember/array';
import { dcElements } from 'oneprovider-gui/utils/parse-dc-xml';
import _ from 'lodash';
import { isEmpty } from 'ember-awesome-macros';
import notImplementedThrow from 'onedata-gui-common/utils/not-implemented-throw';
import { inject as service } from '@ember/service';
import { conditional, equal, raw } from 'ember-awesome-macros';
import computedT from 'onedata-gui-common/utils/computed-t';

const defaultMode = 'visual';

export default Component.extend(I18n, {
  classNames: ['open-data-preview', 'open-data-editor'],

  globalNotify: service(),

  /**
   * @override
   */
  i18nPrefix: 'components.openDataPreview',

  initialData: Object.freeze({}),

  groupedEntries: undefined,

  submit: undefined,

  updateXml: undefined,

  selectedHandleService: undefined,

  handleServices: Object.freeze([]),

  /**
   * @virtual
   * @type {Function}
   */
  changeMode: notImplementedThrow,

  mode: defaultMode,

  xml: undefined,

  init() {
    this._super(...arguments);
    // enable observer
    this.get('triggerUpdateXml');
    if (this.get('xml')) {
      this.xmlObserver();
    } else {
      this.set('groupedEntries', this.getInitialGroupedEntries());
      this.triggerUpdateXmlObserver();
    }
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

  getXml() {
    const generator = dcXmlGenerator.create({
      groupedEntries: plainCopy(this.get('groupedEntries')),
    });
    generator.cleanEmpty();
    return get(generator, 'xml');
  },

  xmlObserver: observer('xml', function xmlObserver() {
    const xml = this.get('xml');
    if (xml != null) {
      const parser = dcXmlParser.create({ xmlSource: xml });
      this.set('groupedEntries', parser.getEmberGroupedEntries());
    }
  }),

  triggerUpdateXmlObserver: observer(
    'triggerUpdateXml',
    function triggerUpdateXmlObserver() {
      this.updateXml(this.getXml());
    }
  ),

  metadataGroupAddList: computed('groupedEntries.[]', function metadataGroupAddList() {
    const currentElements = this.get('groupedEntries').mapBy('type');
    return _.difference(dcElements, currentElements);
  }),

  submitDisabled: isEmpty('selectedHandleService'),

  modeCurrentText: conditional(
    equal('mode', raw('visual')),
    computedT('visualEditor'),
    computedT('xmlEditor'),
  ),

  modeCurrentIcon: conditional(
    equal('mode', raw('visual')),
    raw('visual-editor'),
    raw('xml-file'),
  ),

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
        selectedHandleService,
      } = this.getProperties('submit', 'selectedHandleService');
      return submit(this.getXml(), get(selectedHandleService, 'entityId'))
        .catch(error => {
          this.get('globalNotify').backendError(this.t('publishingData'), error);
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
    nameMatcher(model, term) {
      const nameLower = get(model, 'name').toLocaleLowerCase();
      const termLower = term.toLocaleLowerCase();
      return nameLower.includes(termLower) ? 1 : -1;
    },
    addMetadataGroup(type) {
      this.get('groupedEntries').pushObject(EmberObject.create({
        type,
        values: [''],
      }));
    },
    selectHandleService(handleService) {
      this.set('selectedHandleService', handleService);
    },
    discard() {
      this.get('discard')();
    },
  },
});
