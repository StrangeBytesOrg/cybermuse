# Character oriented AI chat

![Screenshot](https://static-assets.strangebytes.org/demo-screenshot-1.png)

## Features

### Create and Import characters

You can create new characters or use the popular Tavern V2 png format to import any of thousands of existing character cards.

### Intelligent group chat responses

Group chats utilize the LLM itself to pick which character should respond next in a group chat creating a more natural and seamless group chat experience.

### Template based prompt formatting

A templating system based on Handlebars makes it easy to build powerful system prompts.

## Installing

Releases are uploaded regularly on Github. [Download Here](https://github.com/StrangeBytesOrg/cybermuse/releases)

## Building Locally

Building locally requires Go and Bun

Building the frontend for browser use:

```bash
bun install
bun run build
bun run preview
```

Building the full application:

```bash
wails build
```
