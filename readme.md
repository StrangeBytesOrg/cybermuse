# A Batteries Included chat app

![Screenshot](https://chat-desktop.strangebytes.org/chat-app-1.png)

## Features

### Manage and run models locally

Chat app uses llama.cpp under the hood, and includes a model manager to directly download compatible models from Huggingface.

### Create and Import characters

You can create new characters or use the popular Tavern V2 png format to import any of thousands of existing character cards.

### Intelligent group chat responses

Group chats utilize the LLM itself to pick which character should respond next in a group chat creating a more natural and seamless group chat experience.

### Template based prompt formatting

Chat app uses Go's built in templating language to give you complete control over how to format your prompt. Templates for the most popular models are included out of the box.

## Building Locally

Building locally requires Go, Wails, and NodeJS

Client Build:

```bash
wails build
```

A server only build can be created using go tags:

```bash
go build -tags server -o build/bin/chat-server
```
