package main

import (
	"time"
)

const (
	frameMillis int = 16
	frameTime time.Duration = 16 * time.Millisecond
	gameVersion string = "0.1"
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

func (g *Game) LoadLevel(id LevelIdType) {
	g.level.LoadLevel(id, g.grid)
}

func (g *Game) ProcessKeyMsg(id IdType, keyMsg KeyMsg) {
	if !g.grid.Has(Id(playerSpace, id)) {
		return
	}
	player := g.grid.Get(Id(playerSpace, id)).(*Player)
	player.UpdateKeys(keyMsg)
}

func (g *Game) Update() {
	now := time.Now()
	g.grid.Update(now)
	g.grid.PostUpdate(now)
	g.seqNum++
}

func (g* Game) createPlayerInitMsg(id IdType) PlayerInitMsg {
	players := make(PlayerPropMap)

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
	}
}

func (g *Game) createObjectInitMsg() GameStateMsg {
	objs := make(ObjectPropMap)

	for space, objects := range(g.grid.GetManyObjects(wallSpace)) {
		objs[space] = make(SpacedPropMap)
		for id, object := range(objects) {
			objs[space][id] = object.GetInitData().Props()
		}
	}

	return GameStateMsg {
		T: objectDataType,
		S: g.seqNum,
		Os: objs,
	}
}

func (g *Game) createGameInitMsg() GameStateMsg {
	// Use objectUpdateType to ensure this data gets parsed by client.
	return GameStateMsg{
		T: objectUpdateType,
		S: g.seqNum,
		Os: g.grid.GetObjectInitData(),
	}
}

func (g *Game) createGameStateMsg() GameStateMsg {
	return GameStateMsg{
		T: objectDataType,
		S: g.seqNum,
		Os: g.grid.GetObjectData(),
	}
}

func (g *Game) createGameUpdateMsg() (GameStateMsg, bool) {
	updates := g.grid.GetObjectUpdates()
	if len(updates) == 0 {
		return GameStateMsg{}, false
	}	

	msg := GameStateMsg {
		T: objectUpdateType,
		S: g.seqNum,
	}

	if len(updates) > 0 {
		msg.Os = updates
	}
	return msg, true
}