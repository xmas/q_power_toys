'use strict'
require('dotenv').config();
require('colors');

const yargs = require('yargs')
  .usage(`node qapi.js [--whoami | --startExport `)
  .argv;
const axios = require('axios').default
axios.defaults.headers.common['X-API-TOKEN'] = process.env.QUALTRICS_TOKEN
axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.baseURL = `https://${process.env.QUALTRICS_DATA_CENTER}.qualtrics.com/API/v3/`

const {
  exec
} = require('child_process');

if (yargs.whoami) {
  whoami()
}

// WHO AM I
function whoami() {
  axios.get(`whoami`)
    .then((response) => {
      // console.log('sucess'.green)
      console.log(JSON.stringify(response.data, null, 4).green)
    })
    .catch((error) => {
      console.log('fail'.red)

      console.log(error);
    })
}

// START EXPORT
if (yargs.startExport) {
  startExport()
}
function startExport() {
  axios.post(`surveys/${process.env.SURVEY || yargs.startExport}/export-responses`, {
      "format": "json"
    })
    .then((response) => {
      console.log(JSON.stringify(response.data.result.progressId, null, 4))
    })
    .catch((error) => {
      console.log('fail'.red)
      console.log(error);
    })
}
// CHECK EXPORT
if (yargs.checkExport) {
  checkExport()
}
function checkExport() {
  axios.get(`surveys/${process.env.SURVEY}/export-responses/${yargs.checkExport}`)
    .then((response) => {
      // console.log('sucess'.green)
      // console.log(JSON.stringify(response.data, null, 4))
       if (response.data.result.status !== 'complete') {
         console.log(`Export still processing. Status: ${response.data.result.percentComplete}%`)
       }
       console.log(response.data.result.fileId)
    })
    .catch((error) => {
      console.log('fail'.red)
      console.log(error);
    })
}
// GET EXPORT
if (yargs.getExport) {
  getExport()
}
function getExport() {
  const download_cmd = `curl -X GET -H 'X-API-TOKEN: ${process.env.QUALTRICS_TOKEN}' -H 'Content-Type: application/json' ${axios.defaults.baseURL}surveys/${process.env.SURVEY}/export-responses/${yargs.getExport}/file -o ${yargs.getExport}_responses.zip`
  exec(download_cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`.red);
      return;
    }

    console.log(`Exports successfully downloaded. Please unzip your responses.`.green);
    // exec(`unzip ${yargs.getExport}_responses.zip`, (err, stdout, stderr) => {
    //   if (err) {
    //     console.error(`exec error: ${err}`.red);
    //     return;
    //   }

    //   console.log(`Exports successfully unzipped`.green);
    // })
  });
}
console.log(`curl -X GET -H 'X-API-TOKEN: ${process.env.QUALTRICS_TOKEN}' -H 'Content-Type: application/json' ${axios.defaults.baseURL}surveys/${process.env.SURVEY}/`)
