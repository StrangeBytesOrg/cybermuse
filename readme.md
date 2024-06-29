# A Batteries Included chat app

![Screenshot](https://chat-desktop.strangebytes.org/chat-app-1.png)

## Features

### Manage and run models locally

Cybermuse uses llama.cpp under the hood, and includes a model manager to directly download compatible models from Huggingface.

### Create and Import characters

You can create new characters or use the popular Tavern V2 png format to import any of thousands of existing character cards.

### Intelligent group chat responses

Group chats utilize the LLM itself to pick which character should respond next in a group chat creating a more natural and seamless group chat experience.

### Template based prompt formatting

Jinja is used for templating giving you complete control over how the prompt is formatted. Templates for the most popular models are included out of the box.

## Building Locally

Building locally requires NodeJS

Build the frontend, backend, and electron app:

```bash
npm install
npm run build
npm run make
```
