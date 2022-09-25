package main

// Parsed message, only one struct will be set
type Msg struct {
	T MessageType
	Ping PingMsg
	JSON interface{}
	JSONPeer JSONPeerMsg
	Chat ChatMsg
	Key KeyMsg
	Join ClientMsg
	Left ClientMsg
}

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
	Id IdType
	M string
}

type GameStateMsg struct {
	T MessageType
	S SeqNumType
	Os ObjectPropMap
}

type PlayerInitMsg struct {
	T MessageType
	Id IdType
	Ps PlayerPropMap
}

type LevelInitMsg struct {
	T MessageType
	L LevelIdType
	S LevelSeedType
}

type KeyMsg struct {
	T MessageType
	S SeqNumType
	K []KeyType // keys
	M Vec2 // mouse
	D Vec2 // direction
}