#!/bin/bash

atlas migrate diff \
--dir "file://src/server/db/migrations?format=goose" \
--to "sqlite://dev.db" \
--dev-url "sqlite://dev?mode=memory&cache=shared&_fk=1" \
--format '{{ sql . "  " }}'
