import resolver from './helpers/resolver';
import { setResolver } from 'ember-mocha';
import { mocha } from 'mocha';
import handleHidepassed from './handle-hidepassed';

setResolver(resolver);

mocha.setup({
  timeout: 5000,
});

handleHidepassed();
