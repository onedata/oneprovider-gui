/* eslint-env node */
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const suppressNodeBuildErrors = require(
  './lib/onedata-gui-common/addon/utils/suppress-node-build-errors'
);
const defineSassColors = require(
  './lib/onedata-gui-common/addon/utils/define-sass-colors'
);
const defineSassBreakpoints = require(
  './lib/onedata-gui-common/addon/utils/define-sass-breakpoints'
);
const colors = require('./lib/onedata-gui-common/config/colors');
const breakpoints = require('./lib/onedata-gui-common/config/breakpoints');
const copyDynamicLibraries = require('./lib/onedata-gui-common/addon/utils/copy-dynamic-libraries');
const dynamicLibraries = require('./lib/onedata-gui-common/config/dynamic-libraries');

const sass = require('sass-embedded');

const environment = EmberApp.env();

module.exports = function (defaults) {
  suppressNodeBuildErrors();

  const app = new EmberApp(defaults, {
    'fingerprint': {
      extensions: [
        'js',
        'css',
        'map',
        'svg',
        'png',
        'jpg',
        'gif',
        'webmanifest',
        'ttf',
        'woff',
        'woff2',
        'svg',
        'eot',
      ],
      replaceExtensions: ['html', 'css', 'js', 'webmanifest'],
      generateAssetMap: true,
      fingerprintAssetMap: true,
    },
    // see: https://github.com/babel/ember-cli-babel/tree/v7.3.0#options
    'babel': {},
    'sassOptions': {
      implementation: sass,
      outputStyle: 'expanded',
      includePaths: [
        'app/styles',
        // onedata-gui-common addon
        'lib/onedata-gui-common/app/styles',
        'lib/onedata-gui-common/app/styles/onedata-gui-common',
        'lib/onedata-gui-common/app/styles/onedata-gui-common/oneicons',
        'lib/onedata-gui-common/app/styles/onedata-gui-common/components',
      ],
      onlyIncluded: false,
    },
    // a "bootstrap" should be imported into app.scss
    'ember-cli-bootstrap-sassy': {
      // import SASS styles and some JS that is used outside of ember-bootstrap components
      js: [
        'transition',
        // TODO: rewrite collapses to ember-bootstrap components
        'tooltip',
        'collapse',
        'popover',
      ],
      glyphicons: false,
    },
    // import only JS
    'ember-bootstrap': {
      importBootstrapCSS: false,
      importBootstrapTheme: false,
      importBootstrapFont: true,
      bootstrapVersion: 3,
    },
    'ember-cli-chartist': {
      useCustomCSS: true,
    },
    'ember-cli-string-helpers': {
      only: ['capitalize', 'dasherize', 'lowercase', 'truncate'],
    },
    'ace': {
      themes: ['textmate'],
      modes: ['json', 'xml'],
      workers: ['json', 'xml'],
      exts: ['searchbox'],
      workerPath: './assets/ace',
    },
    'autoImport': {
      publicAssetURL: environment === 'test' ? '/assets/' : './assets/',
    },
  });

  defineSassColors(app, colors);
  defineSassBreakpoints(app, breakpoints);
  copyDynamicLibraries(app, dynamicLibraries);

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  const NODE_ASSETS = [
    'chartist-plugin-legend/chartist-plugin-legend.js',
    'basictable/basictable.css',
    'perfect-scrollbar/css/perfect-scrollbar.css',
    'webui-popover/dist/jquery.webui-popover.css',
    'webui-popover/dist/jquery.webui-popover.js',
    'jquery-datetimepicker/build/jquery.datetimepicker.min.css',
    'jquery-datetimepicker/build/jquery.datetimepicker.full.js',
    'spin.js/spin.css',
  ];

  NODE_ASSETS.forEach(path => app.import(`node_modules/${path}`));

  return app.toTree();
};
