import 'dotenv/config'

import express from 'express'

import { statusRouter } from './routers/index.js'

const port = Number(process.env.SERVER_PORT)

/* create an express app and use JSON */
const app = new express()
app.use(express.json())

/* something to test the server */
app.get('/', (req, res) => res.send({ "hello": "world" }))

/* bring in some routers */
app.use('/status', statusRouter)

/* start the server */
app.listen(port, (err) => {

  if (err) {
    console.log("Error starting server. Bigfoot is sad.")
    return
  }

  console.log(`👣 Bigfoot Tracker API ready at http://localhost:${port}. 👣`)
})
