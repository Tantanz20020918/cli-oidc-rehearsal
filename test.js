'use strict';

const assert = require('node:assert/strict');
const rehearsal = require('./index');

assert.equal(rehearsal(), 'npm trusted publishing rehearsal');
