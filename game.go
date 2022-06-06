package main

import (
	"time"
)

const (
	debugMode bool = false
)

type Game struct {
	grid *Grid
	level LevelIdType
	seqNum SeqNumType
}

func newGame() *Game {
	game := &Game {
		grid: NewGrid(4, 4),
		level: unknownLevel,
		seqNum: 0,
	}
	return game
}

func (g *Game) add(init Init) Object {
	var object Object

	// TODO: move this logic to grid
	switch init.GetSpace() {
	case playerSpace:
		object = NewPlayer(init)
	case wallSpace:
		object = NewWall(init)
	case platformSpace:
		object = NewPlatform(init)
	case bombSpace:
		object = NewBomb(init)
	case boltSpace:
		object = NewBolt(init)
	case rocketSpace:
		object = NewRocket(init)
	case explosionSpace:
		object = NewExplosion(init)
	case pickupSpace:
		object = NewPickup(init)
	default:
		Debug("Unknown space! %+v", init)
	}

	if object != nil {
		g.grid.Upsert(object)
	}
	return object
}

func (g *Game) has(sid SpacedId) bool {
	return g.grid.Has(sid)
}

func (g *Game) delete(sid SpacedId) {
	g.grid.Delete(sid)
}

func (g *Game) getData(sid SpacedId) Data {
	if !isWasm {
		panic("getData called outside of WASM")
	}

	return g.grid.Get(sid).GetData()
}

func (g *Game) setData(sid SpacedId, data Data) {
	if !isWasm {
		panic("setData called outside of WASM")
	}

	object := g.grid.Get(sid)
	object.SetData(data)
	g.grid.Upsert(object)
}

func (g *Game) processKeyMsg(id IdType, keyMsg KeyMsg) {
	if !g.grid.Has(Id(playerSpace, id)) {
		return
	}
	player := g.grid.Get(Id(playerSpace, id)).(*Player)
	player.updateKeys(keyMsg)
}

func (g *Game) updateState() {
	now := time.Now()
	g.grid.Update(now)
	g.grid.Postprocess(now)
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
		L: g.level,
	}
}

func (g *Game) createObjectInitMsg() GameStateMsg {
	objs := make(ObjectPropMap)

	for space, objects := range(g.grid.GetManyObjects(platformSpace, wallSpace)) {
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
	return GameStateMsg{
		T: objectDataType,
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
	gameUpdates := g.grid.GetGameUpdates()
	if len(updates) == 0 && len(gameUpdates) == 0 {
		return GameStateMsg{}, false
	}	

	msg := GameStateMsg {
		T: objectUpdateType,
		S: g.seqNum,
	}

	if len(updates) > 0 {
		msg.Os = updates
	}
	if len(gameUpdates) > 0 {
		msg.G = gameUpdates
	}
	return msg, true
}