package main

import (
	"fmt"
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
	mode GameMode
	objectStates map[SpacedId]StatePropMap
}

func NewGameState() GameState {
	return GameState {
		mode: NewVipMode(),
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
	return gs.mode.GetState()
}

func (gs *GameState) Update(g *Grid) {
	gs.mode.Update(g)
}

func (gs *GameState) SignalVictory(team uint8) {
	gs.mode.SignalVictory(team)
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
