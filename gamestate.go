package main

type GameStateType uint8
const (
	unknownGameState GameStateType = iota
	lobbyGameState
	activeGameState
	victoryGameState
)

type ScoreType uint16
type StatePropMap map[Prop]*State
type GameState struct {
	mode GameMode
}

func NewGameState() GameState {
	return GameState {
		mode: NewVipMode(),
	}
}

func (gs GameState) GetState() (GameStateType, bool) {
	return gs.mode.GetState()
}

func (gs *GameState) Update(g *Grid) {
	gs.mode.Update(g)
}

func (gs *GameState) SignalVictory(team uint8) {
	gs.mode.SignalVictory(team)
}

func (gs GameState) GetProps() SpacedPropMap {
	props := make(SpacedPropMap)
	if isWasm {
		return props
	}

	state, stateChanged := gs.GetState()
	teamScores := gs.mode.GetTeamScores()
	if stateChanged {
		props[0] = make(PropMap)
		props[0][stateProp] = state

		props[1] = make(PropMap)
		props[1][scoreProp] = teamScores[1]

		props[2] = make(PropMap)
		props[2][scoreProp] = teamScores[2]
	}

	return props
}
