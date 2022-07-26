import 'dotenv/config'

import express from 'express'

import { statusRouter, motdRouter, reportRouter, sightingsRouter } from './routers/index.js'

const port = Number(process.env.SERVER_PORT)

/* create an express app and use JSON */
const app = new express()
app.use(express.json({ strict: false }))

/* something to test the server */
app.get('/', (req, res) => res.send({ "hello": "world" }))

/* bring in some routers */
app.use('/status', statusRouter)
app.use('/motd', motdRouter)
app.use('/report', reportRouter)
app.use('/sightings', sightingsRouter)

/* start the server */
app.listen(port, (err) => {

  if (err) {
    console.log("Error starting server. Bigfoot is sad.")
    return
  }

  console.log(`👣 Bigfoot Tracker API ready at http://localhost:${port}. 👣`)
})
