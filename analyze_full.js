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

// "QID37 - Topic Sentiment Score": "Product - Usability: 2,Support Staff: 3,Support answer: 2",

let by_topic = _.flatMap(responses, (r) => {
    let topics = r["QID37 - Topic Sentiment Score"]
    if (!topics) {
      return
    }
    topics = topics.split(',')
    return _.map(topics, (topic) => {
      var deep = _.cloneDeep(r);
      let i = topic.indexOf(":")
      let score = topic.slice(i+2, topic.length)
      let name = topic.slice(0,i)
      let type
      if (score < 3 && score > -3) {
        type = "NEU"
      } else if (score >= 3) {
        type = "POS"
      } else {
        type = "NEG"
      }
      // console.log(score)
      // console.log(` score: ${Number.parseInt(score.trim())} ${score} ${typeof score} type: ${type} name: ${name}`)

      deep['topic'] = `${name} - ${type}`
      return deep
    })
})

// console.log(Object.keys(_.keyBy(all, 'topic')))


let questions = [{
    key: 'QID30',
    label: "NPS"
  },
  {
    key: 'Q72_1',
    label: "Sat Sales"
  },
  {
    key: 'Q72_2',
    label: "Sat Service & Support"
  },
  {
    key: 'Q72_3',
    label: "Sat Product"
  },
  {
    key: 'Q73_1',
    label: "Importance Sales"
  },
  {
    key: 'Q73_2',
    label: "Importance Service & Support"
  },
  {
    key: 'Q73_3',
    label: "Importance Product"
  },
]

let all = _.chain(_.filter(by_topic))
.filter( (r) => {
  for (let q in questions) {
    let key = questions[q].key
    if (!r[key]) {
      return false
    }

  }
  return true
})
.map( (r) => {
  for (let q in questions) {
    let key = questions[q].key
    r[key] = parseInt(r[key])
  }
  return r

})
.groupBy( (r) => { 
  let nps = parseInt(r.QID30_NPS_GROUP) === 3 ? 'Promoter' : "Passive or Detractor"
  return `${r.topic} - ${nps}`
})
.flatMap( (set, groupName) => {
  console.log(groupName, set.length)
  if (set.length > 30) {
    return weightsForResponses(set, groupName)
  } else {
    console.log(`Group: ${groupName} Count: ${set.length}`.red)
  }
  return null
})
.filter()
.value()
const ObjectsToCsv = require('objects-to-csv');
new ObjectsToCsv(all).toDisk(`data/topic-nps.csv`);

// console.log(all)


function weightsForResponses(responses, groupName) {

  let matrixValues = _.map(responses, (r) => {
    let vals = []
    for (let q in questions) {
      let key = questions[q].key
      vals.push(r[key])
    }
    return vals
  })

  let m = new Matrix(matrixValues)
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