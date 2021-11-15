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
	voiceCandidateType

	voiceOfferType
	voiceAnswerType
	initType
	joinType
	leftType

	initVoiceType
	joinVoiceType
	leftVoiceType
	chatType
	keyType

	gameStateType
	playerInitType
	levelInitType
	objectInitType
)

const (
	unknownIdSpace int = iota
	playerIdSpace
	objectIdSpace
)

const (
	unknown int = iota
	
	upKey
	downKey
	leftKey
	rightKey
	dashKey

	mouseClick
	altMouseClick
)

type PingMsg struct {
	T int
	S int // seq num
}

type JSONMsg struct {
	T int
	JSON interface{}
}

type JSONPeerMsg struct {
	T int
	From int
	To int
	JSON interface{}
}

type ClientData struct {
	Id int
	Name string
}

type ClientMsg struct {
	T int
	Client ClientData
	Clients map[int]ClientData
}

type ChatMsg struct {
	T int
	Client ClientData
	Message string
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
	Ps []PlayerInitData
}

type LevelInitMsg struct {
	T int
	L int // level index
}

type ObjectInitMsg struct {
	T int
	Os []ObjectInitData
}

type KeyMsg struct {
	T int
	S int // seq num
	K []int // keys
	M Vec2 // mouse
}