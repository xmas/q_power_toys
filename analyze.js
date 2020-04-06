'use strict'
const _ = require('lodash')
const fs = require('fs')
require('colors');
const {
  Matrix,
  correlation
} = require('ml-matrix');

const yargs = require('yargs')
  .argv;

let responses = JSON.parse(fs.readFileSync(yargs.file))

let questions = [{
    key: 'QID30',
    label: "NPS"
  },
  {
    key: 'QID72_1',
    label: "Sat Sales"
  },
  {
    key: 'QID72_2',
    label: "Sat Service & Support"
  },
  {
    key: 'QID72_3',
    label: "Sat Product"
  },
  {
    key: 'QID73_1',
    label: "Importance Sales"
  },
  {
    key: 'QID73_2',
    label: "Importance Service & Support"
  },
  {
    key: 'QID73_3',
    label: "Importance Product"
  },
]

let all = _.chain(responses)
.filter( (r) => {
  for (let q in questions) {
    let key = questions[q].key
    if (!r[key]) {
      return false
    }

  }
  return true
})
.filter( (r) => {
  // console.log(r.ClientCountry)
  return r.ClientCountry !== 'undefined'
})
.groupBy( (r) => { 
  let country =  r.ClientCountry || r.Country
  if (!country) {
    return null
  }
  let nps = r.QID30_NPS_GROUP === 3 ? 'Promoter' : "Passive or Detractor"

  return `${country} - ${nps}`

})
.flatMap( (set, groupName) => {
  // console.log(groupName, set.length)
  if (set.length > 30) {
    return weightsForResponses(set, groupName)
  } 
  return null
})
.filter()
.value()
const ObjectsToCsv = require('objects-to-csv');
new ObjectsToCsv(all).toDisk(`data/country-nps.csv`);

console.log(all)


function weightsForResponses(responses, groupName) {


  let filteredResponses = _.chain(responses)
    // .filter((r) => {

    //   for (let q in questions) {
    //     let key = questions[q].key
    //     if (!r[key]) {
    //       return false
    //     }

    //   }
    //   return true
    // })
    .map((r) => {
      let vals = []
      for (let q in questions) {
        let key = questions[q].key
        vals.push(r[key])
      }
      return vals
    })
    .value()

  let m = new Matrix(filteredResponses)
  let m_c = correlation(m)
  let r2 = squareMatrix(m_c.toJSON())

  function squareMatrix(m) {
    for (let r = 0; r < m.length; r++) {
      let row = m[r]

      for (let c = 0; c < row.length; c++) {
        let cell = row[c]
        row[c] = cell * cell
        if (r == c) {
          row[c] = 1
        }
      }
    }
    return m
  }


  const jrwAnalysis = require('johnsons-relative-weights');

  const jrwResults = jrwAnalysis(
    r2,
    1
  );

  let results = []
  for (let q = 0; q < questions.length - 1; q++) {
    let key = questions[q + 1]
    results.push({
      group: groupName,
      question: key.label,
      weight: jrwResults.rescaledRawRelativeWeights[q]
    })
    // console.log(`"${key.label}","${key.key}",${jrwResults.rawRelativeWeights[q]},${jrwResults.rescaledRawRelativeWeights[q]}`)
  }

  return results
}