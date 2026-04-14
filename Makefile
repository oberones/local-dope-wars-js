SHELL := /bin/sh

SERVICE := local-dope-wars
COMPOSE := docker compose
NPM := npm
SUBPATH_BASE ?= /apps/local-dope-wars/

.PHONY: help install dev lint build build-subpath test check preview docker-config docker-build docker-up docker-down docker-logs clean

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make install        Install npm dependencies' \
		'  make dev            Run the Vite dev server' \
		'  make lint           Run eslint' \
		'  make build          Build the production bundle' \
		'  make build-subpath  Build for a subpath deploy (default /apps/local-dope-wars/)' \
		'  make test           Run the current verification suite (lint + build)' \
		'  make check          Alias for test' \
		'  make preview        Preview the production bundle locally' \
		'  make docker-config  Render the resolved docker compose config' \
		'  make docker-build   Build the production container image' \
		'  make docker-up      Start the production container stack' \
		'  make docker-down    Stop the production container stack' \
		'  make docker-logs    Tail compose logs for the app service' \
		'  make clean          Remove the local dist directory'

install:
	$(NPM) ci

dev:
	$(NPM) run dev

lint:
	$(NPM) run lint

build:
	$(NPM) run build

build-subpath:
	VITE_BASE_PATH=$(SUBPATH_BASE) $(NPM) run build

test:
	$(NPM) run check

check: test

preview:
	$(NPM) run preview

docker-config:
	$(COMPOSE) config

docker-build:
	$(COMPOSE) build $(SERVICE)

docker-up:
	$(COMPOSE) up -d $(SERVICE)

docker-down:
	$(COMPOSE) down

docker-logs:
	$(COMPOSE) logs -f $(SERVICE)

clean:
	rm -rf dist
