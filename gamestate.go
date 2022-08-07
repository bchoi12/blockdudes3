package main

type ScoreType uint8
type StatePropMap map[Prop]*State
type GameState struct {
	gameState StatePropMap
	objectStates map[SpacedId]StatePropMap
}

func NewGameState() GameState {
	return GameState {
		gameState: make(StatePropMap),
		objectStates: make(map[SpacedId]StatePropMap),
	}
}

func (gs *GameState) RegisterId(sid SpacedId) {
	if _, ok := gs.objectStates[sid]; ok {
		Debug("Skipping registration of duplicate object %+v", sid)
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

func (gs GameState) ValidProp(prop Prop) bool {
	return prop != initializedProp
}

func (gs *GameState) IncrementScore(sid SpacedId, prop Prop, delta int) {
	if sid.GetSpace() != playerSpace {
		Debug("Skipping setting score for non-player %+v", sid)
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
		Debug("Skipping setting prop %d for non-existent player %+v", prop, sid)
	}
	if !gs.HasObjectState(sid, prop) {
		gs.objectStates[sid][prop] = NewState(data)
		return
	}
	gs.objectStates[sid][prop].Set(data)
}

func (gs GameState) GetInitData() Data {
	data := NewData()

	objectStates := make(ObjectPropMap)
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

	if len(objectStates) > 0 {
		data.Set(objectStatesProp, objectStates)
	}
	
	return data
}

func (gs GameState) GetUpdates() Data {
	updates := NewData()

	objectStates := make(ObjectPropMap)
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
	if len(objectStates) > 0 {
		updates.Set(objectStatesProp, objectStates)
	}

	return updates
}