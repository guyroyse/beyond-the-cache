# Strings #

Our Bigfoot Tracker API needs to provide a message of the day. This is a message that will be displayed on the site, if it exists. We want the message to be temporary. So, it needs to be able to be set and removed. And, it'd be nice if it could jsut go away on it's own.

Go ahead and open **`src/motd.js`** as this is where we'll be making our changes.

##

We'll be using the Redis commands of GET, SET, and UNLINK through Node Redis. And, we'll look at a new command SETEX which combines SET and EXPIRE atomically.


Configuring data for clients with strings. Temp message with SET and EXPIRE.

### GET ###
curl -X GET http://localhost:8080/motd

### SET ###
curl -X PUT -H "Content-Type: application/json" -d '{"motd":"Eat more chicken","expireIn":10}' http://localhost:8080/motd

### EXPIRE ###

### UNLINK ###
curl -X DELETE http://localhost:8080/motd

## Lists ##

Imcoming reports as a List

## Hashes ##

CRUD sightings data with Hashes

## Sets ##

All of the sightings with Sets.
Indexing our sitings with Sets.


