'use strict'
const _ = require('lodash')
const fs = require('fs')
const {readCSV } = require('./readCSV.js')

const yargs = require('yargs')
  .argv;

readCSV(yargs.file)
.then( (rows) => {
  console.log(JSON.stringify(rows, null, 4))
})

