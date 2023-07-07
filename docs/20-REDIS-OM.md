# Redis OM #

Describe what Redis OM is.

## Installing Redis OM ##

- I've already installed it for you. But here's how you'd do it:

## Schemas and Repositories ##

Describe them.

Schema defines how to convert and index data. Does not need to define everything. Will do best effort for unknown things.

Repository allows you to create, save, fetch and delete.

### Creating a Schema ###

Add the Schema to the file, replacing the call to FT.CREATE.

Not the path property. Optional but I've included to point out that you can *change* them. And that they can be used to index nested JSON documents.

### Creating a Repository ###

Create a repository.
Call createIndex.
- note that it will automatically recreate if changed or not there

## Reading, Writing, and Removing ##

POST
GET
PUT
DELETE

## Searching ##

### All the Things ###

### Pagination ###

### Actually Searching ##

- add a geo example
- add a numeric example

