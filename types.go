package main

import (
	"time"
)

const (
	frameMillis int = 16
	frameTime time.Duration = 16 * time.Millisecond
)

type MessageType uint8
type SeqNumType uint32
const (
	unknownType MessageType = iota

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

type IdType uint16
type IdSpaceType uint8
const (
	unknownIdSpace IdSpaceType = iota
	playerIdSpace
	objectIdSpace
)

type ObjectClassType uint8
const (
	unknownObjectClass ObjectClassType = iota
	playerObjectClass
	wallObjectClass
	bombObjectClass
	explosionObjectClass
)

// Can't get this to work with uint8 for some reason
type KeyType int
const (
	unknownKey KeyType = iota
	
	upKey
	downKey
	leftKey
	rightKey
	dashKey

	mouseClick
	altMouseClick
)

type PingMsg struct {
	T MessageType
	S SeqNumType
}

type JSONMsg struct {
	T MessageType
	JSON interface{}
}

type JSONPeerMsg struct {
	T MessageType
	From IdType
	To IdType
	JSON interface{}
}

type ClientData struct {
	Id IdType
	Name string
}

type ClientMsg struct {
	T MessageType
	Client ClientData
	Clients map[IdType]ClientData
}

type ChatMsg struct {
	T MessageType
	Client ClientData
	Message string
}

type GameStateMsg struct {
	T MessageType
	S SeqNumType
	Ps map[IdType]PlayerData
	Os map[IdType]ObjectData
	Ss []ShotData
}

type PlayerInitMsg struct {
	T MessageType
	Ps []Init
}

type LevelInitMsg struct {
	T MessageType
	L int // level index
}

type ObjectInitMsg struct {
	T MessageType
	Os []Init
}

type KeyMsg struct {
	T MessageType
	S SeqNumType
	K []KeyType // keys
	M Vec2 // mouse
}