require('dotenv').config()
const express = require('express')
const { json } = require('express/lib/response')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()
app.use(express.static('build'))
app.use(express.json())
app.use(cors())

// app.use(morgan('tiny'))
morgan.token('reqbody', (req, res) => {
  return req.method === 'POST' ? JSON.stringify(req.body) : '-'
})
app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms :reqbody'
  )
)

app.get('/info', (request, response, next) => {
  Person.count({})
    .then(count => {
      const datetime = new Date()
      const responseStr = `<p>Phonebook has info for ${count} people</br></br>${datetime}</p>`
      response.status(200).end(responseStr)
    })
    .catch(error => next(error))
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => response.status(204).end())
    .catch(error => next(error))
})

// const generateId = () => {
//   const maxId =
//     persons.length > 0 ? Math.max(...persons.map(person => person.id)) : 0
//   return maxId + 1
// }

// const generateRandomId = () => {
//   return Math.floor(Math.random() * (2 ** 31 - 1))
// }

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  if (!body.name) {
    return response.status(400).send({ error: 'missing name' })
  } else if (!body.number) {
    return response.status(400).send({ error: 'missing number' })
  }

  const person = {
    name: body.name,
    number: body.number,
  }
  Person.findByIdAndUpdate(request.params.id, person, {
    new: true,
    runValidators: true,
    context: 'query',
  })
    .then(updatedPerson => response.json(updatedPerson))
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  let errorJson = null
  if (!body.name) {
    errorJson = { error: 'name missing' }
  } else if (!body.number) {
    errorJson = { error: 'number missing' }
  }
  if (errorJson) {
    return response.status(400).json(errorJson)
  }

  Person.findOne({ name: body.name })
    .then(person => {
      if (person) {
        response
          .status(400)
          .json({ error: `Person '${body.name}' already exists` })
      } else {
        const newPerson = new Person({
          name: body.name,
          number: body.number,
        })
        newPerson
          .save()
          .then(savedPerson => response.json(savedPerson))
          .catch(error => response.status(400).json({ error: error.message }))
      }
    })
    .catch(error => next(error))

  // const personObj = {
  //   name: body.name,
  //   number: body.number,
  // }

  // Person.findOneAndUpdate({ name: body.name }, personObj, {
  //   upsert: true,
  //   new: true,
  //   runValidators: true,
  //   context: 'query',
  // })
  //   .then(person => response.json(person))
  //   .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.log(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
