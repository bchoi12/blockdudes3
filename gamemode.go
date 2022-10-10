package main

type GameMode interface {
	Update(g * Grid)
	GetState() (GameStateType, bool)
	SetState(state GameStateType)

	GetTeamScores() map[uint8]int
	SignalVictory(team uint8)
}

type BaseGameMode struct {
	state GameStateType
	stateChanged bool

	winningTeam uint8
	teamScores map[uint8]int
}

func NewBaseGameMode() BaseGameMode {
	return BaseGameMode {
		state: unknownGameState,
		stateChanged: false,
		teamScores: make(map[uint8]int),
	}
}

func (bgm BaseGameMode) Update(g * Grid) {
	bgm.stateChanged = false
}

func (bgm BaseGameMode) GetState() (GameStateType, bool) {
	return bgm.state, bgm.stateChanged
}

func (bgm *BaseGameMode) SetState(state GameStateType) {
	if bgm.state != state {
		bgm.state = state
		bgm.stateChanged = true
	}
}