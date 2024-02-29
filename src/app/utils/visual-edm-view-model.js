import EmberObject, { observer } from '@ember/object';

// FIXME: ta klasa jest całkowicie eksperymentalna - obecnie ważne jest tylko edmMetadata

const VisualEdmViewModel = EmberObject.extend({
  //#region dependencies

  xmlValue: undefined,

  /**
   * @type {Utils.Edm.EdmMetadata}
   */
  edmMetadata: undefined,

  //#endregion

  //#region state

  /**
   * @type {DOMParser}
   */
  xmlParser: undefined,

  /**
   * @type {XMLDocument}
   */
  xmlDoc: undefined,

  /**
   * @type {Object}
   */
  dummyState: undefined,

  //#endregion

  xmlValueObserver: observer('xmlValue', function xmlValueObserver() {
    this.set(
      'xmlDoc',
      this.xmlValue ? this.xmlParser.parseFromString(this.xmlValue, 'text/xml') : null
    );
    this.updateView();
  }),

  init() {
    this._super(...arguments);
    this.set('xmlParser', new DOMParser());
    this.xmlValueObserver();
  },

  updateView() {
    if (!this.xmlDoc) {
      return {};
    }
    // this.xmlDoc.children[0] - rdf
    //
    const dummyState = {};

    const providedCHO = this.xmlDoc.children[0]
      ?.querySelector('ProvidedCHO');

    if (providedCHO) {

      // FIXME: iść po odpowiedniej ścieżce
      const titleNodes = [...providedCHO.querySelectorAll('title')];

      dummyState.titles = titleNodes.map(titleNode => ({
        text: titleNode.textContent,
        lang: titleNode.getAttribute('xml:lang') ?? null,
      }));

      dummyState.title = providedCHO
        ?.querySelector('title')
        ?.textContent ?? '';

      dummyState.titleLang = providedCHO
        ?.querySelector('title')
        ?.getAttribute('xml:lang') ?? '';
    }

    this.set('dummyState', dummyState);
  },
});

export default VisualEdmViewModel;
