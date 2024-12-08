# JDNA Sync

This utility program primarily syncs the stores and terminals to/from the local database to/from other external services.
It is built with the intention of being run on via web ui, api, cron job, or command line invocation.

## Usage

### Command Line

You will need to setup your environment variables.

```shell
cp .env.example .env
npm run dev -- --help
# or
npm run dev -- help
```

To sync stores:

```shell
npm run dev -- sync --stores
# or sync only for one fascia/banner
npm run dev -- sync --fascia=dtlr --stores
```

To sync terminals:

```shell
npm run dev -- sync --terminals
# or sync only for one fascia/banner
npm run dev -- sync --fascia=dtlr --terminals
```

### Web UI/API

```shell
cp .env.example .env
npm run dev -- serve
```

The web endpoint will be available at `http://localhost:3000`. The port can be overridden with the `APP_PORT` environment variable.

## Development

```shell
npm install
npm run dev
```
