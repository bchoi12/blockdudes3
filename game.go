package main

import (
	"time"
)

type Game struct {
	grid *Grid
	level int

	players map[int]*Player
	objects map[int]*Object

	updateBuffer *UpdateBuffer
	updates int
}

func newGame() *Game {
	game := &Game {
		grid: NewGrid(4, 4),
		level: unknownLevel,

		players: make(map[int]*Player, 0),
		objects: make(map[int]*Object, 0),

		updates: 0,
	}
	return game
}

func (g *Game) addPlayer(initData PlayerInitData) {
	id := initData.Init.Id
	g.players[id] = NewPlayer(initData)
	g.grid.Upsert(g.players[id])
}

func (g *Game) hasPlayer(id int) bool {
	_, ok := g.players[id]
	return ok
}

func (g *Game) deletePlayer(id int) {
	g.grid.Delete(Id(playerIdSpace, id))
	delete(g.players, id)
}

func (g *Game) processKeyMsg(id int, keyMsg KeyMsg) {
	g.players[id].updateKeys(keyMsg)
}

func (g *Game) addObject(initData ObjectInitData) {
	id := initData.Init.Id
	g.objects[id] = NewObject(initData)
	g.grid.Upsert(g.objects[id])
}

func (g *Game) hasObject(id int) bool {
	_, ok := g.objects[id]
	return ok
}

func (g *Game) setPlayerData(id int, data PlayerData) {
	if !isWasm {
		panic("setPlayerData called outside of WASM")
	}

	g.players[id].setPlayerData(data)
	g.grid.Upsert(g.players[id])
}

func (g *Game) setObjectData(id int, data ObjectData) {
	if !isWasm {
		panic("setObjectData called outside of WASM")
	}

	g.objects[id].setObjectData(data)
	g.grid.Upsert(g.objects[id])
}

func (g *Game) updateState() {
	g.updateBuffer = NewUpdateBuffer()

	now := time.Now()
	for _, o := range(g.objects) {
		if o.UpdateState(g.grid, g.updateBuffer, now) {
			g.grid.Upsert(o)
			g.updateBuffer.rawObjects[o.id] = o
		}
	}
	for _, p := range(g.players) {
		if p.UpdateState(g.grid, g.updateBuffer, now) {
			g.grid.Upsert(p)
			g.updateBuffer.rawPlayers[p.id] = p
		}
	}

	g.updateBuffer.process(g.grid)
	g.updates++
}

func (g* Game) createPlayerInitMsg() PlayerInitMsg {
	players := make([]PlayerInitData, 0)

	for id, player := range(g.players) {
		players = append(players, NewPlayerInitData(id, player.Profile.Pos(), player.Profile.Dim()))
	}

	return PlayerInitMsg{
		T: playerInitType,
		Ps: players,
	}
}

func (g* Game) createPlayerJoinMsg(id int) PlayerInitMsg {
	players := make([]PlayerInitData, 1)
	players[0] = NewPlayerInitData(id, g.players[id].Profile.Pos(), g.players[id].Profile.Dim())
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

	for _, obj := range(g.objects) {
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