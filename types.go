package main

const (
	pingType int = 9
	candidateType int = 10
	offerType int = 11
	answerType int = 12

	initType int = 1
	joinType int = 5
	leftType int = 6
	chatType int = 2
	keyType int = 3

	playerStateType int = 4
	playerInitType int = 8
	objectInitType int = 7

	// next: 13
)

type PingMsg struct {
	T int
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
}