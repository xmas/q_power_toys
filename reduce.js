'use strict'
const _ = require('lodash')
const fs = require('fs')

const yargs = require('yargs')
  .argv;

let data = JSON.parse(fs.readFileSync(yargs.file))
let values = _.map(data.responses, 'values')
console.log(JSON.stringify(values, null, 4))
