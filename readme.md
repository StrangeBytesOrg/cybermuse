# A Batteries Included chat app

![Screenshot](https://chat-desktop.strangebytes.org/chat-app-1.png)

## Features

### Create and Import characters

You can create new characters or use the popular Tavern V2 png format to import any of thousands of existing character cards.

### Intelligent group chat responses

Group chats utilize the LLM itself to pick which character should respond next in a group chat creating a more natural and seamless group chat experience.

### Template based prompt formatting

Jinja is used for templating giving you complete control over how the prompt is formatted.

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
