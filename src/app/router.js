/**
 * Experimental router for plugable views for Onedata Onezone
 * @module router
 * @author Jakub Liput
 * @copyright (C) 2019 ACK CYFRONET AGH
 * @license This software is released under the MIT license cited in 'LICENSE.txt'.
 */

import EmberRouter from '@ember/routing/router';

import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL,
});

Router.map(function () {
  Router.reopen({
    location: 'hash',
    rootURL: null,
  });
  this.route('login');
  this.route('onedata', function onedataRoute() {
    this.route('components', function onedataComponentsRoute() {
      this.route('show', { path: ':component_id' });
    });
  });
  // TODO: authorization, login and public paths
  // paths that are displayed standalone, changing path support
  // WS connection is made with nobody account
  // can be used to display full page (eg. shares) or embedding some view
  // in external website (eg. public file browser)
  // this.route('public', function publicRoute() {
  //   this.route('shares', function publicSharesRoute() {
  //     this.route('show', { path: ':share_id' },
  //       function publicSharesShowRoute() {
  //         this.route('dir', { path: ':public_dir_id' });
  //       });
  //   });
  // });
});

export default Router;
