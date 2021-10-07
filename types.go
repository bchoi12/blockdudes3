package main

import (
	"time"
)

const (
	frameTime time.Duration = 16 * time.Millisecond
	frameMillis int = 16
)

const (
	unknownType int = iota

	pingType
	candidateType
	offerType
	answerType
	initType

	joinType
	leftType
	chatType
	keyType
	playerStateType

	playerInitType
	objectInitType
)

const (
	unknown int = iota
	
	upKey
	downKey
	leftKey
	rightKey

	mouseClick
)

type PingMsg struct {
	T int
	N int // number
}

type JSONMsg struct {
	T int
	JSON interface{}
}

type ClientMsg struct {
	T int
	Id int
	C ClientData
	Cs map[int]ClientData
}

type ClientData struct {
	N string
}

type ChatMsg struct {
	T int
	Id int
	N string
	M string // message
}

type PlayerInitMsg struct {
	T int
	Ps map[int]PlayerInitData
}

type PlayerStateMsg struct {
	T int
	TS int64
	Ps map[int]PlayerData
}

type ObjectInitMsg struct {
	T int
	Os map[int]ObjectInitData
}

type KeyMsg struct {
	T int
	K []int // keys
	M Vec2 // mouse
}