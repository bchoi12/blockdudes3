package main

import (
	"time"
)

const (
	frameMillis int = 16
	frameTime time.Duration = 16 * time.Millisecond
	gameVersion string = "0.1"
)

type GameUpdateType uint8
const (
	unknownGameUpdate GameUpdateType = iota
	objectGameUpdate
	levelGameUpdate
	gameStateUpdate
)

type Game struct {
	grid *Grid
	level *Level
	seqNum SeqNumType
}

func NewGame() *Game {
	grid := NewGrid(4, 4)
	game := &Game {
		grid: grid,
		level: NewLevel(),
		seqNum: 0,
	}
	return game
}

func (g *Game) Add(init Init) Object {
	object := g.grid.New(init)
	if object != nil {
		g.grid.Upsert(object)
	}
	return object
}

func (g Game) Get(sid SpacedId) Object {
	return g.grid.Get(sid)
}

func (g Game) Has(sid SpacedId) bool {
	return g.grid.Has(sid)
}

func (g *Game) Delete(sid SpacedId) {
	g.grid.Delete(sid)
}

func (g *Game) GetData(sid SpacedId) Data {
	if !isWasm {
		panic("getData called outside of WASM")
	}

	return g.grid.Get(sid).GetData()
}

func (g *Game) SetData(sid SpacedId, data Data) {
	if !isWasm {
		panic("setData called outside of WASM")
	}

	object := g.grid.Get(sid)
	object.SetData(data)
	g.grid.Upsert(object)
}

func (g Game) GetGrid() *Grid {
	return g.grid
}

func (g *Game) LoadLevel(id LevelIdType, seed LevelSeedType) {
	g.level.LoadLevel(id, seed, g.grid)
}

func (g *Game) ProcessKeyMsg(id IdType, keyMsg KeyMsg) {
	if !g.grid.Has(Id(playerSpace, id)) {
		return
	}
	player := g.grid.Get(Id(playerSpace, id)).(*Player)
	player.UpdateKeys(keyMsg)
}

func (g *Game) Update() map[GameUpdateType]bool {
	updates := make(map[GameUpdateType]bool)

	state, stateChanged := g.grid.GetGameState()

	if state == setupGameState {
		mode := g.grid.GetGameModeConfig()
		seed := LevelSeedType(UnixMilli() % 3333333)
		g.level.LoadLevel(mode.levelId, seed, g.grid)
		g.grid.SetGameState(mode.nextState)
		updates[levelGameUpdate] = true
	}

	if stateChanged {
		updates[gameStateUpdate] = true
	}

	now := time.Now()
	g.grid.Update(now)
	updates[objectGameUpdate] = true
	g.seqNum++

	return updates
}

func (g* Game) createPlayerInitMsg(id IdType) PlayerInitMsg {
	players := make(SpacedPropMap)

	for _, player := range(g.grid.GetObjects(playerSpace)) {
		players[player.GetId()] = player.GetInitData().Props()
	}

	return PlayerInitMsg{
		T: playerInitType,
		Id: id,
		Ps: players,
	}
}

func (g *Game) createLevelInitMsg() LevelInitMsg {
	return LevelInitMsg{
		T: levelInitType,
		L: g.level.GetId(),
		S: g.level.GetSeed(),
	}
}

func (g *Game) createLevelObjectInitMsg() ObjectStateMsg {
	objs := make(ObjectPropMap)

	for _, object := range(g.grid.GetAllObjects()) {
		if !object.HasAttribute(fromLevelAttribute) {
			continue
		}

		if _, ok := objs[object.GetSpace()]; !ok {
			objs[object.GetSpace()] = make(SpacedPropMap)
		}

		objs[object.GetSpace()][object.GetId()] = object.GetInitData().Props()
	} 

	return ObjectStateMsg {
		T: objectDataType,
		S: g.seqNum,
		Os: objs,
	}
}

func (g *Game) createObjectInitMsg() ObjectStateMsg {
	// Use objectUpdateType to ensure this data gets parsed by client.
	return ObjectStateMsg{
		T: objectUpdateType,
		S: g.seqNum,
		Os: g.grid.GetObjectInitData(),
	}
}

func (g *Game) createObjectDataMsg() ObjectStateMsg {
	return ObjectStateMsg{
		T: objectDataType,
		S: g.seqNum,
		Os: g.grid.GetObjectData(),
	}
}

func (g *Game) createObjectUpdateMsg() (ObjectStateMsg, bool) {
	updates := g.grid.GetObjectUpdates()
	if len(updates) == 0 {
		return ObjectStateMsg{}, false
	}

	msg := ObjectStateMsg {
		T: objectUpdateType,
		S: g.seqNum,
		Os: updates,
	}
	return msg, true
}

func (g *Game) createGameStateMsg() GameStateMsg {
	return GameStateMsg{
		T: gameStateType,
		G: g.grid.GetGameStateProps(),
	}
}