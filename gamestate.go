package main

import (
	"fmt"
	"math/rand"
	"time"
)

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
	state GameStateType
	stateChanged bool
	restartTimer Timer

	winningTeam uint8
	teamScores map[uint8]int
	objectStates map[SpacedId]StatePropMap
}

func NewGameState() GameState {
	return GameState {
		state: lobbyGameState,
		stateChanged: false,
		restartTimer: NewTimer(5 * time.Second),

		winningTeam: 0,
		teamScores: make(map[uint8]int),
		objectStates: make(map[SpacedId]StatePropMap),
	}
}

// Props published to client
var gameStateExternalProps = map[Prop]bool {
	deletedProp: true,
	killProp: true,
	deathProp: true,
}

func (gs *GameState) RegisterId(sid SpacedId) {
	if _, ok := gs.objectStates[sid]; ok {
		Log(fmt.Sprintf("Skipping registration of duplicate object %+v", sid))
		return
	}

	gs.objectStates[sid] = make(StatePropMap)
	gs.objectStates[sid][initializedProp] = NewBlankState(false)
	gs.objectStates[sid][deletedProp] = NewBlankState(false)

	if sid.GetSpace() == playerSpace {
		gs.objectStates[sid][killProp] = NewState(ScoreType(0))
		gs.objectStates[sid][deathProp] = NewState(ScoreType(0))
	}
}

func (gs GameState) GetState() (GameStateType, bool) {
	return gs.state, gs.stateChanged
}

func (gs *GameState) Update(g *Grid) {
	gs.stateChanged = false
	if gs.state == unknownGameState {
		return
	}

	players := g.GetObjects(playerSpace)
	if gs.state == lobbyGameState {
		teams := make(map[uint8][]*Player)
		for _, player := range(players) {
			team, _ := player.GetByteAttribute(teamByteAttribute)
			teams[team] = append(teams[team], player.(*Player))
		}

		if len(teams[0]) > 0 {
			return
		}
		if len(teams[1]) == 0 || len(teams[2]) == 0 {
			return
		}

		rand.Seed(time.Now().UnixNano())
		offense := uint8(rand.Intn(2) + 1)
		vip := rand.Intn(len(teams[offense]))
		teams[offense][vip].AddAttribute(vipAttribute)

		// Start game
		for _, player := range(players) {
			// TODO: Respawn should be Object method, just reset Pos to InitPos
			player.(*Player).Respawn()
		}

		gs.SetState(activeGameState)
	} else if gs.state == activeGameState {
		alive := make(map[uint8]int)
		for _, player := range(players) {
			team, _ := player.GetByteAttribute(teamByteAttribute)
			if team == 0 {
				continue
			}

			if !player.HasAttribute(deadAttribute) {
				alive[team] += 1
			} else if player.HasAttribute(vipAttribute) {
				gs.winningTeam = 3 - team
			}
		}

		if gs.winningTeam == 0 {
			if alive[1] == 0 {
				gs.winningTeam = 2
			}
			if alive[2] == 0 {
				gs.winningTeam = 1
			}
		}

		if gs.winningTeam != 0 {
			gs.teamScores[gs.winningTeam] += 1
			gs.SetState(victoryGameState)
			gs.restartTimer.Start()
		}
	} else if gs.state == victoryGameState {
		if gs.restartTimer.On() {
			return
		}

		gs.winningTeam = 0
		for _, player := range(players) {
			player.RemoveAttribute(vipAttribute)
			player.(*Player).SetTeam(0, g)
			player.(*Player).Respawn()
		}
		gs.SetState(lobbyGameState)
	}
}

func (gs *GameState) SetState(state GameStateType) {
	if gs.state != state {
		gs.state = state
		gs.stateChanged = true
	}
}

func (gs GameState) ValidProp(prop Prop) bool {
	external, ok := gameStateExternalProps[prop]
	return ok && external
}

func (gs *GameState) IncrementProp(sid SpacedId, prop Prop, delta int) {
	if !gs.HasId(sid) {
		return
	}
	if sid.GetSpace() != playerSpace {
		return
	}

	gs.objectStates[sid][prop].Set(gs.objectStates[sid][prop].Peek().(ScoreType) + ScoreType(delta))
}

func (gs *GameState) SignalVictory(team uint8) {
	if gs.winningTeam == 0 {
		gs.winningTeam = team
	}
}

func (gs GameState) HasId(sid SpacedId) bool {
	if _, ok := gs.objectStates[sid]; !ok {
		return false
	}
	return true	
}

func (gs GameState) HasObjectState(sid SpacedId, prop Prop) bool {
	if !gs.HasId(sid) {
		return false
	}
	if _, ok := gs.objectStates[sid][prop]; !ok {
		return false
	}
	return true
}

func (gs *GameState) GetObjectState(sid SpacedId, prop Prop) *State {
	if !gs.HasObjectState(sid, prop) {
		return nil
	}
	return gs.objectStates[sid][prop]
}

func (gs *GameState) SetObjectState(sid SpacedId, prop Prop, data interface{}) {
	if !gs.HasId(sid) {
		return
	}
	if !gs.HasObjectState(sid, prop) {
		gs.objectStates[sid][prop] = NewState(data)
		return
	}
	gs.objectStates[sid][prop].Set(data)
}

func (gs GameState) GetObjectInitProps() ObjectPropMap {
	objectStates := make(ObjectPropMap)
	if isWasm {
		return objectStates
	}

	for sid, states := range(gs.objectStates) {
		for prop, state := range(states) {
			if gs.ValidProp(prop) && state.Has() {
				if _, ok := objectStates[sid.GetSpace()]; !ok {
					objectStates[sid.GetSpace()] = make(SpacedPropMap)
				}
				if _, ok := objectStates[sid.GetSpace()][sid.GetId()]; !ok {
					objectStates[sid.GetSpace()][sid.GetId()] = make(PropMap)
				}
				objectStates[sid.GetSpace()][sid.GetId()][prop] = state.Peek()
			}
		}
	}
	
	return objectStates
}

func (gs GameState) GetObjectPropUpdates() ObjectPropMap {
	objectStates := make(ObjectPropMap)
	if isWasm {
		return objectStates
	}

	for sid, states := range(gs.objectStates) {
		for prop, state := range(states) {
			if !gs.ValidProp(prop) {
				continue
			}
			if data, ok := state.GetOnce(); ok {
				if _, ok := objectStates[sid.GetSpace()]; !ok {
					objectStates[sid.GetSpace()] = make(SpacedPropMap)
				}
				if _, ok := objectStates[sid.GetSpace()][sid.GetId()]; !ok {
					objectStates[sid.GetSpace()][sid.GetId()] = make(PropMap)
				}
				objectStates[sid.GetSpace()][sid.GetId()][prop] = data
			}
		}
	}
	return objectStates
}

func (gs GameState) GetProps() SpacedPropMap {
	props := make(SpacedPropMap)
	if isWasm {
		return props
	}

	if gs.stateChanged {
		props[0] = make(PropMap)
		props[0][stateProp] = gs.state

		props[1] = make(PropMap)
		props[1][scoreProp] = gs.teamScores[1]

		props[2] = make(PropMap)
		props[2][scoreProp] = gs.teamScores[2]
	}

	return props
}
