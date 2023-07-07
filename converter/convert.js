import csv from 'csv-parser'
import fs from 'fs'

fs.createReadStream('../data/bfro_reports_geocoded.csv')
  .pipe(csv())
  .on('data', data => {

    // the CSV data often has empty string where we want undefined, so call
    // a bunch of functions to give us undefined where we want
    const reportId = toInteger(data.number).toString()
    const title = toTitle(data.title)
    const date = data.date
    const timestamp = toTimestamp(data.date)
    const observed = data.observed
    const classification = toTag(data.classification)
    const county = toCounty(data.county)
    const state = toTag(data.state)
    const longitude = toFloat(data.longitude)
    const latitude = toFloat(data.latitude)
    const location_geo = toGeo(data.longitude, data.latitude)
    const location_point = toPoint(data.longitude, data.latitude)
    const location_details = data.location_details
    const temperature_high = toFloat(data.temperature_high)
    const temperature_mid = toFloat(data.temperature_mid)
    const temperature_low = toFloat(data.temperature_low)
    const temperature = toTemperature(data.temperature_high, data.temperature_mid, data.temperature_low)
    const dew_point = toFloat(data.dew_point)
    const humidity = toFloat(data.humidity)
    const cloud_cover = toFloat(data.cloud_cover)
    const moon_phase = toFloat(data.moon_phase)
    const precip_intensity = toFloat(data.precip_intensity)
    const precip_probability = toFloat(data.precip_probability)
    const precip_type = toTag(data.precip_type)
    const pressure = toFloat(data.pressure)
    const summary = data.summary
    const uv_index = toInteger(data.uv_index)
    const visibility = toFloat(data.visibility)
    const wind_bearing = toInteger(data.wind_bearing)
    const wind_speed = toFloat(data.wind_speed)

    // create the HASH to save
    const hash =
      Object.fromEntries(
        Object
          .entries({
            reportId, title, date, observed, classification,
            county, state, location: location_geo, location_details })
          .filter(entry => entry[1] !== undefined)) // removes empty values

    // create the JSON to save
    const json =
      Object.fromEntries(
        Object
          .entries({
            reportId, title, date, timestamp, observed, classification,
            county, state, latitude, longitude, location: location_geo, location_details,
            temperature, dew_point, humidity, cloud_cover, moon_phase,
            precip_intensity, precip_probability, precip_type,
            pressure, summary, uv_index, visibility,
            wind_bearing, wind_speed })
          .filter(entry => entry[1] !== undefined)) // removes empty values

    // create the OM JSON to save
    const om =
      Object.fromEntries(
        Object
          .entries({
            reportId, title, date, timestamp, observed, classification,
            county, state, latitude, longitude, location: location_point, location_details,
            temperature, dew_point, humidity, cloud_cover, moon_phase,
            precip_intensity, precip_probability, precip_type,
            pressure, summary, uv_index, visibility,
            wind_bearing, wind_speed })
          .filter(entry => entry[1] !== undefined)) // removes empty values


    // write the data to files
    fs.writeFile(
      `../data/hash/bigfoot-sighting-${reportId}.hash.json`,
      JSON.stringify(hash, null, 2),
      err => {
        if (err) console.log(err)
      })

    fs.writeFile(
      `../data/json/bigfoot-sighting-${reportId}.json`,
      JSON.stringify(json, null, 2),
      err => {
        if (err) console.log(err)
      })

      fs.writeFile(
      `../data/om/bigfoot-sighting-${reportId}.om.json`,
      JSON.stringify(om, null, 2),
      err => {
        if (err) console.log(err)
      })

  })

function toTitle(value) {
  return value.replace(/^Report \d*: /, '')
}

function toCounty(value) {
  return toTag(value.replace(/ County$/, ''))
}

function toTimestamp(value) {
  return value !== '' ? Math.floor(Date.parse(value) / 1000) : undefined
}

function toTag(value) {
  return value !== '' ? value : undefined
}

function toGeo(longitude, latitude) {
  return longitude !== '' && latitude !== '' ? `${toFloat(longitude)},${toFloat(latitude)}` : undefined
}

function toPoint(longitude, latitude) {
  return longitude !== '' && latitude !== '' ? { longitude: toFloat(longitude), latitude: toFloat(latitude) } : undefined
}

function toTemperature(high, mid, low) {
  const temperature = {}
  if (high !== '') temperature.high = toFloat(high)
  if (mid !== '') temperature.mid = toFloat(mid)
  if (low !== '') temperature.low = toFloat(low)
  return temperature
}

function toInteger(value) {
  return value !== '' ? parseInt(value) : undefined
}

function toFloat(value) {
  return value !== '' ? round(parseFloat(value)) : undefined
}

function round(num) {
  return +(Math.round(num + 'e+5') + 'e-5')
}
