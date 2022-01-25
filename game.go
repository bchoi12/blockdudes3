package main

import (
	"time"
)

const (
	debugMode bool = true
)

type Game struct {
	grid *Grid
	level LevelIdType

	updateBuffer *UpdateBuffer
	updates SeqNumType
}

func newGame() *Game {
	game := &Game {
		grid: NewGrid(4, 4),
		level: unknownLevel,

		updates: 0,
	}
	return game
}

func (g *Game) add(init Init) {
	var thing Thing

	switch init.GetSpace() {
	case playerSpace:
		thing = NewPlayer(init)
	case wallSpace:
		thing = NewWall(init)
	case platformSpace:
		thing = NewPlatform(init)
	case bombSpace:
		thing = NewBomb(init)
	case explosionSpace:
		thing = NewExplosion(init)
	default:
		Debug("Unknown space! %+v", init)
	}

	if thing != nil {
		g.grid.Upsert(thing)
	}
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

	thing := g.grid.Get(sid)
	thing.SetData(data)
	g.grid.Upsert(thing)
}

func (g *Game) processKeyMsg(id IdType, keyMsg KeyMsg) {
	player := g.grid.Get(Id(playerSpace, id)).(*Player)
	player.updateKeys(keyMsg)
}

func (g *Game) updateState() {
	g.updateBuffer = NewUpdateBuffer()

	now := time.Now()
	for _, thing := range(g.grid.GetAllThings()) {
		if thing.GetSpace() == playerSpace {
			continue
		}
		g.updateThing(thing, now)
	}

	for _, thing := range(g.grid.GetThings(playerSpace)) {
		g.updateThing(thing, now)
	}

	g.updateBuffer.process(g.grid)
	g.updates++
}

func (g *Game) updateThing(thing Thing, now time.Time) {
	updated := thing.UpdateState(g.grid, g.updateBuffer, now)
	if updated && g.grid.Has(thing.GetSpacedId()) {
		g.grid.Upsert(thing)
		g.updateBuffer.rawThings[thing.GetSpacedId()] = thing
	}
}

func (g* Game) createPlayerInitMsg(id IdType) PlayerInitMsg {
	players := make(PlayerPropMap)

	for _, t := range(g.grid.GetThings(playerSpace)) {
		player := t.(*Player)
		players[player.GetId()] = player.GetData().Props()
	}

	return PlayerInitMsg{
		T: playerInitType,
		Id: id,
		Ps: players,
	}
}

func (g* Game) createPlayerJoinMsg(id IdType) PlayerInitMsg {
	players := make(PlayerPropMap)
	player := g.grid.Get(Id(playerSpace, id)).(*Player)
	players[id] = player.GetData().Props()
	return PlayerInitMsg{
		T: playerJoinType,
		Ps: players,
	}
}

func (g *Game) createLevelInitMsg() LevelInitMsg {
	return LevelInitMsg{
		T: levelInitType,
		L: g.level,
	}
}

func (g *Game) createObjectInitMsg() ObjectInitMsg {
	objs := make(map[SpaceType]map[IdType]PropMap)

	for space, things := range(g.grid.GetManyThings(platformSpace, wallSpace)) {
		objs[space] = make(map[IdType]PropMap)
		for id, thing := range(things) {
			objs[space][id] = thing.GetData().Props()
		}
	}

	return ObjectInitMsg{
		T: objectInitType,
		Os: objs,
	}
}

func (g *Game) createGameStateMsg() GameStateMsg {
	return GameStateMsg{
		T: gameStateType,
		S: g.updates,
		Ps: g.updateBuffer.players,
		Os: g.updateBuffer.objects,
		Ss: g.updateBuffer.shots,
	}
}