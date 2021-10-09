package main

import "log"

func Debug(format string, v ...interface{}) {
	log.Printf(format, v)
}

func WasmDebug(format string, v ...interface{}) {
	if !isWasm {
		return
	}
	log.Printf(format, v)
}