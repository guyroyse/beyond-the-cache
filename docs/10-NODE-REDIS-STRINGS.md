## Strings ##

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


