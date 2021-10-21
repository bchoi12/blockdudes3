package main

import (
	"time"
)

const (
	frameMillis int = 16
	frameTime time.Duration = 16 * time.Millisecond
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
	gameStateType

	playerInitType
	objectInitType
)

const (
	unknown int = iota
	
	upKey
	downKey
	leftKey
	rightKey
	dashKey

	mouseClick
)

type PingMsg struct {
	T int
	S int // seq num
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

type GameStateMsg struct {
	T int
	S int // seq num
	Ps map[int]PlayerData
	Os map[int]ObjectData
	Ss []ShotData
}

type PlayerInitMsg struct {
	T int
	Ps map[int]PlayerInitData
}

type ObjectInitMsg struct {
	T int
	Os map[int]ObjectInitData
}

type KeyMsg struct {
	T int
	S int // seq num
	K []int // keys
	M Vec2 // mouse
}