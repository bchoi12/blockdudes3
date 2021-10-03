package main

import (
	"github.com/vmihailenco/msgpack/v5"
)

func Pack(msg interface{}) []byte {
	b, err := msgpack.Marshal(msg)
	if err != nil {
		panic(err)
	}
	return b
}

func Unpack(b []byte, msg interface{}) error {
	err := msgpack.Unmarshal(b, msg)
	if err != nil {
		return err
	}
	return nil
}