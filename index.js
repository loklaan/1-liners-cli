#!/usr/bin/env node
'use strict';

const meow = require('meow');
const cli = meow(`
  Usage
    $ 1-liners [functionName]

  Description
    ${require('./src/services').getDesc()}

  Options
    --print, -p   Print to stdout
    --help        Print this message

  Examples
    $ 1-liners throttle
`);

if (cli.flags.help) {
  process.exit(0);
}

require('./dist/cli.js')
