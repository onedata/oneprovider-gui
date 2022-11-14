// FIXME: jsdoc

// FIXME: implementation based on CRC-16: https://github.com/alexgorbatchev/node-crc/blob/master/src/calculators/crc16kermit.ts
export default class HashGenerator {
  constructor() {
    /** @type {Object<string, string>} */
    this.cache = {};
  }

  /**
   * @param {string} value
   * @returns {string}
   */
  getHash(value) {
    if (!this.cache[value]) {
      this.cache[value] = this.generate(value);
    }
    return this.cache[value];
  }

  /**
   * @param {string} value
   * @returns {string}
   */
  generate(value) {
    // FIXME: fake function
    return '#' + Math.floor((Math.random() * 300000)).toString(16).slice(0, 4);
  }
}
