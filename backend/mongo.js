const mongoose = require('mongoose')

const nArgs = process.argv.length

if (nArgs !== 3 && nArgs !== 5) {
  console.log(
    'Please adhere to proper usage of the app: none mongo.js <password> "entry_name" entry_number'
  )
  process.exit(1)
}

const url = `mongodb+srv://fullstack:${process.argv[2]}@cluster0.xcld3.mongodb.net/phonebookApp?retryWrites=true&w=majority`

mongoose.connect(url)

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

if (process.argv.length === 3) {
  console.log('Retrieving person entries from the database')
  Person.find({}).then(result => {
    console.log('phonebook:')
    result.forEach(person => {
      console.log(person.name, person.number)
    })
    mongoose.connection.close()
  })
} else {
  const person = new Person({
    name: process.argv[3],
    number: process.argv[4],
  })
  person.save().then(result => {
    console.log('person saved!')
    mongoose.connection.close()
  })
}
