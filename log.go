package main

import "log"

func Log(message string) {
	log.Printf("%s", message)
}

func WasmDebug(format string, v ...interface{}) {
	if !isWasm {
		return
	}
	log.Printf(format, v)
}