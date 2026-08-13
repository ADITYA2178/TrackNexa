const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const requestLogger = require('./middleware/requestLogger')

const app = express()

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use('/', routes)

module.exports = app
