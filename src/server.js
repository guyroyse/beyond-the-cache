import 'dotenv/config'

import express from 'express'

import { statusRouter } from './routers/index.js'

const port = Number(process.env.SERVER_PORT)

/* create an express app and use JSON */
const app = new express()
app.use(express.json())

/* bring in some routers */
app.use('/status', statusRouter)

/* start the server */
app.listen(port)
