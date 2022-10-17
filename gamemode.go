package main

type GameStateType uint8
const (
	unknownGameState GameStateType = iota
	lobbyGameState
	setupGameState
	activeGameState
	victoryGameState
)

type GameMode interface {
	DataMethods

	GetConfig() GameModeConfig
	GetState() (GameStateType, bool)
	SetState(state GameStateType)

	Update(g * Grid)
	SetWinningTeam(team uint8)
}

type GameModeConfig struct {
	leftTeam uint8
	rightTeam uint8
	reverse bool

	nextState GameStateType
	levelId LevelIdType
}

type BaseGameMode struct {
	config GameModeConfig

	lastState GameStateType
	state GameStateType
	firstFrame bool

	winningTeam uint8
	teamScores map[uint8]int
}

func NewBaseGameMode() BaseGameMode {
	return BaseGameMode {
		lastState: unknownGameState,
		state: unknownGameState,
		firstFrame: false,

		winningTeam: 0,
		teamScores: make(map[uint8]int),
	}
}

func (bgm *BaseGameMode) Update(g * Grid) {
	bgm.firstFrame = bgm.lastState != bgm.state
	bgm.lastState = bgm.state
}

func (bgm BaseGameMode) GetConfig() GameModeConfig {
	return bgm.config
}

func (bgm BaseGameMode) GetState() (GameStateType, bool) {
	return bgm.state, bgm.state != bgm.lastState
}

func (bgm *BaseGameMode) SetState(state GameStateType) {
	bgm.state = state
}

func (bgm* BaseGameMode) SetData(data Data) {
	if data.Has(stateProp) {
		bgm.SetState(data.Get(stateProp).(GameStateType))
	}
}

func (bgm BaseGameMode) GetInitData() Data {
	return NewData()
}

func (bgm BaseGameMode) GetData() Data {
	return NewData()
}

func (bgm BaseGameMode) GetUpdates() Data {
	data := NewData()
	data.Set(stateProp, bgm.state)
	data.Set(scoreProp, bgm.teamScores)
	return data
}