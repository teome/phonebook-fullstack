import React, { useEffect, useState } from 'react'
import personsService from './services/persons'

const Notification = ({ message, isError = false }) => {
  const notificationStyle = {
    color: isError ? 'red' : 'green',
    background: 'lightgrey',
    fontSize: '20px',
    borderStyle: 'solid',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '10px',
  }

  if (message === null) {
    return null
  }
  return (
    <div className='error' style={notificationStyle}>
      {message}
    </div>
  )
}

const Entry = ({ person, handleButtonClick }) => (
  <li>
    {person.name} {person.number}{' '}
    <button onClick={handleButtonClick(person)}>delete</button>
  </li>
)

const Numbers = ({ persons, handleButtonClick }) => {
  return (
    <ul>
      {persons.map(person => (
        <Entry
          key={person.name}
          person={person}
          handleButtonClick={handleButtonClick}
        />
      ))}
    </ul>
  )
}

const Filter = ({ nameFilterKey, handleNameFilterKeyChange }) => {
  return (
    <div>
      filter shown with{' '}
      <input value={nameFilterKey} onChange={handleNameFilterKeyChange} />
    </div>
  )
}

const PersonForm = ({
  addPerson,
  newName,
  handleNameChange,
  newNumber,
  handleNumberChange,
}) => {
  return (
    <form onSubmit={addPerson}>
      <div>
        name: <input value={newName} onChange={handleNameChange} />
      </div>
      <div>
        number: <input value={newNumber} onChange={handleNumberChange} />
      </div>
      <div>
        <button type='submit'>add</button>
      </div>
    </form>
  )
}

const App = () => {
  // const [persons, setPersons] = useState([
  //   { name: 'Arto Hellas', number: '040-123456', id: 1 },
  //   { name: 'Ada Lovelace', number: '39-44-5323523', id: 2 },
  //   { name: 'Dan Abramov', number: '12-43-234345', id: 3 },
  //   { name: 'Mary Poppendieck', number: '39-23-6423122', id: 4 }
  // ])
  const [persons, setPersons] = useState([])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [nameFilterKey, setNameFilterKey] = useState('')
  const [infoMessage, setInfoMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    personsService.getAll().then(returnedPersons => setPersons(returnedPersons))
    showInfoMessage('Got initial phonebook DB entries')
  }, [])

  const showInfoMessage = message => {
    setInfoMessage(message)
    setTimeout(() => setInfoMessage(null), 5000)
  }
  const showErrorMessage = message => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  const handleNameChange = event => setNewName(event.target.value)
  const handleNumberChange = event => setNewNumber(event.target.value)
  const handleNameFilterKeyChange = event =>
    setNameFilterKey(event.target.value)

  const handleButtonClick = person => {
    return () => {
      if (!window.confirm(`Delete ${person.name}?`)) {
        return
      }
      personsService
        .deleteEntry(person.id)
        .then(response => setPersons(persons.filter(p => p.id !== person.id)))
        .catch(error =>
          alert(
            `the person '${person.name}' could not be deleted from the database`
          )
        )
      showInfoMessage(`Deleted the entry for '${person.name}'`)
    }
  }

  const addPerson = event => {
    event.preventDefault()
    const newObject = {
      name: newName,
      number: newNumber,
    }

    // check that we don't already have the name
    const personDb = persons.find(person => person.name === newName)
    if (personDb) {
      if (
        window.confirm(
          `${newName} is already added to phonebook, replace the old number with a new one?`
        )
      ) {
        personsService
          .update(personDb.id, newObject)
          .then(returnedPerson => {
            // setPersons({ ...persons, returnedPerson })
            setPersons(
              persons.filter(p => p.id !== personDb.id).concat(returnedPerson)
            )
            setNewName('')
            setNewNumber('')
            showInfoMessage(`Updated the number for '${personDb.name}'`)
          })
          .catch(error => {
            showErrorMessage(error.response.data.error)
            // NB Pretty sure we don't need this and it definitely causes
            // client errors when server errors that aren't not finding
            // the entry - e.g. invalid number. If there's no entry then
            // we would have returned nothing without error, server just does
            // nothing and we'll concat nothing above in the `then` function.
            // Instead, leave the form values there to be adjusted if needed
            // setPersons(persons.filter(p => p.id !== personDb.id))
            // setNewName('')
            // setNewNumber('')
          })
      }
    } else {
      personsService
        .create(newObject)
        .then(returnedPerson => {
          setPersons(persons.concat(returnedPerson))
          setNewName('')
          setNewNumber('')
          showInfoMessage(`Created new entry for '${newObject.name}'`)
        })
        .catch(error => {
          console.log(error.response.data)
          showErrorMessage(error.response.data.error)
        })
    }
  }

  const personsToShow = persons.filter(person =>
    person.name.toLowerCase().includes(nameFilterKey.toLowerCase())
  )

  return (
    <div>
      <h2>Phonebook</h2>
      <Notification message={infoMessage} isError={false} />
      <Notification message={errorMessage} isError={true} />
      <Filter
        nameFilterKey={nameFilterKey}
        handleNameFilterKeyChange={handleNameFilterKeyChange}
      />
      <h2>add a new</h2>
      <PersonForm
        addPerson={addPerson}
        newName={newName}
        handleNameChange={handleNameChange}
        newNumber={newNumber}
        handleNumberChange={handleNumberChange}
      />
      <h2>Numbers</h2>
      <Numbers persons={personsToShow} handleButtonClick={handleButtonClick} />
    </div>
  )
}

export default App
