//go:build server
// +build server

package main

import (
	"context"
)

func main() {
	app := NewApp()
	app.startup(context.Background())
}
