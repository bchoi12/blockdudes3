package main

import (
	"time"
)

type Game struct {
	grid *Grid
	level int

	updateBuffer *UpdateBuffer
	updates int
}

func newGame() *Game {
	game := &Game {
		grid: NewGrid(4, 4),
		level: unknownLevel,

		updates: 0,
	}
	return game
}

func (g *Game) addPlayer(initData PlayerInitData) {
	g.grid.Upsert(NewPlayer(initData))
}

func (g *Game) setPlayerData(id int, data PlayerData) {
	if !isWasm {
		panic("setPlayerData called outside of WASM")
	}

	player := g.grid.Get(Id(playerIdSpace, id)).(*Player)
	player.setPlayerData(data)
	g.grid.Upsert(player)
}

func (g *Game) addObject(initData ObjectInitData) {
	g.grid.Upsert(NewObject(initData))
}

func (g *Game) setObjectData(id int, data ObjectData) {
	if !isWasm {
		panic("setObjectData called outside of WASM")
	}

	object := g.grid.Get(Id(objectIdSpace, id)).(*Object)
	object.setObjectData(data)
	g.grid.Upsert(object)
}

func (g *Game) has(sid SpacedId) bool {
	return g.grid.Has(sid)
}

func (g *Game) delete(sid SpacedId) {
	g.grid.Delete(sid)
}

func (g *Game) processKeyMsg(id int, keyMsg KeyMsg) {
	player := g.grid.Get(Id(playerIdSpace, id)).(*Player)
	player.updateKeys(keyMsg)
}

func (g *Game) updateState() {
	g.updateBuffer = NewUpdateBuffer()

	now := time.Now()
	for _, t := range(g.grid.GetThings(objectIdSpace)) {
		o := t.(*Object)
		if o.UpdateState(g.grid, g.updateBuffer, now) {
			g.grid.Upsert(o)
			g.updateBuffer.rawObjects[o.GetId()] = o
		}
	}
	for _, t := range(g.grid.GetThings(playerIdSpace)) {
		p := t.(*Player)
		if p.UpdateState(g.grid, g.updateBuffer, now) {
			g.grid.Upsert(p)
			g.updateBuffer.rawPlayers[p.GetId()] = p
		}
	}

	g.updateBuffer.process(g.grid)
	g.updates++
}

func (g* Game) createPlayerInitMsg() PlayerInitMsg {
	players := make([]PlayerInitData, 0)

	for id, t := range(g.grid.GetThings(playerIdSpace)) {
		player := t.(*Player)
		players = append(players, NewPlayerInitData(id, player.Profile.Pos(), player.Profile.Dim()))
	}

	return PlayerInitMsg{
		T: playerInitType,
		Ps: players,
	}
}

func (g* Game) createPlayerJoinMsg(id int) PlayerInitMsg {
	player := g.grid.Get(Id(playerIdSpace, id)).(*Player)
	players := make([]PlayerInitData, 1)
	players[0] = NewPlayerInitData(id, player.Profile.Pos(), player.Profile.Dim())
	return PlayerInitMsg{
		T: playerInitType,
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
	objs := make([]ObjectInitData, 0)

	for _, t := range(g.grid.GetThings(objectIdSpace)) {
		obj := t.(*Object)
		objs = append(objs, obj.getObjectInitData())
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