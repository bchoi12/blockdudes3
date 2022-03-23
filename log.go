package main

import "log"

func Log(message string) {
	log.Printf("%s", message)
}

func Debug(format string, v ...interface{}) {
	log.Printf(format, v)
}

func WasmDebug(format string, v ...interface{}) {
	if !isWasm {
		return
	}
	log.Printf(format, v)
}