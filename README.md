# deno-kv-test

Deno KV example project. Caution: This application needs Deno version 1.33.0 or
higher.

## Run server

To run the webserver execute **deno task start**.

## Run tests

Tests can be run by executing **deno task test**. If you want to collect test
coverage execute **deno task coverage**

## Lint

To check for linting issues execute **deno task lint**.

## Format

To format the code execute **deno task format**.

## Routes

- /person Get all persons
- /person/ID Get person for given ID
- "/" (and fallback route) display welcome message
- OPTIONS request: Empty response with reflected origin header
