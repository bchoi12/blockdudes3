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

	objectDataType
	objectUpdateType
	playerInitType
	levelInitType
)

type IdType uint16
type SpaceType uint8
const (
	unknownSpace SpaceType = iota
	playerSpace
	wallSpace
	bombSpace
	boltSpace
	rocketSpace
	explosionSpace
	pickupSpace
)

type AttributeType uint8
const (
	unknownAttribute AttributeType = iota

	stairAttribute
	platformAttribute
)

type LevelIdType uint8
const (
	unknownLevel LevelIdType = iota
	testLevel
)

// Can't get this to work with uint8 for some reason
type KeyType uint16
const (
	unknownKey KeyType = iota
	
	upKey
	downKey
	leftKey
	rightKey

	dashKey
	interactKey

	mouseClick
	altMouseClick
)

type PlayerPropMap map[IdType]PropMap
type ShotPropMaps []PropMap
type ObjectPropMap map[SpaceType]map[IdType]PropMap
type SpacedPropMap map[IdType]PropMap

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
	// TODO: this only needs to be ID
	Client ClientData
	M string
}

type GameStateMsg struct {
	T MessageType
	S SeqNumType
	Os ObjectPropMap
	G PropMap
}

type PlayerInitMsg struct {
	T MessageType
	Id IdType
	Ps PlayerPropMap
}

type LevelInitMsg struct {
	T MessageType
	L LevelIdType
}

type KeyMsg struct {
	T MessageType
	S SeqNumType
	K []KeyType // keys
	M Vec2 // mouse
	D Vec2 // direction
}