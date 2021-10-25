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
		grid: NewGrid(),
		level: unknownLevel,

		updates: 0,
	}
	return game
}

func (g *Game) addPlayer(id int, initData PlayerInitData) {
	g.grid.addPlayer(id, initData)
}

func (g *Game) hasPlayer(id int) bool {
	return g.grid.hasPlayer(id)
}

func (g *Game) deletePlayer(id int) {
	g.grid.deletePlayer(id)
}

func (g *Game) setPlayerData(id int, data PlayerData) {
	g.grid.setPlayerData(id, data)
}

func (g *Game) processKeyMsg(id int, keyMsg KeyMsg) {
	g.grid.players[id].updateKeys(keyMsg)
}

func (g *Game) addObject(id int, initData ObjectInitData) {
	object := NewObject(id, initData)
	g.grid.addObject(id, object)
}

func (g *Game) hasObject(id int) bool {
	return g.grid.hasObject(id)
}

func (g *Game) setObjectData(id int, data ObjectData) {
	g.grid.setObjectData(id, data)
}

func (g *Game) setObjects(objectInitData map[int]ObjectInitData) {
	objects := make(map[int]*Object, 0)
	for id, initData := range(objectInitData) {
		objects[id] = NewObject(id, initData)
	}
	g.grid.setObjects(objects)
}

func (g *Game) updateState() {
	g.updateBuffer = NewUpdateBuffer()

	now := time.Now()
	for _, o := range(g.grid.objects) {
		o.updateState(g.grid, g.updateBuffer, now)
	}
	for _, p := range(g.grid.players) {
		p.updateState(g.grid, g.updateBuffer, now)
	}
	g.updates++
}

func (g* Game) createPlayerInitMsg() PlayerInitMsg {
	players := make(map[int]PlayerInitData, len(g.grid.players))

	for id, player := range(g.grid.players) {
		players[id] = PlayerInitData {
			Pos: player.Profile.Pos(),
			Dim: player.Profile.Dim(),
		}
	}

	return PlayerInitMsg{
		T: playerInitType,
		Ps: players,
	}
}

func (g* Game) createPlayerJoinMsg(id int) PlayerInitMsg {
	players := make(map[int]PlayerInitData, 1)
	players[id] = PlayerInitData {
		Pos: g.grid.players[id].Profile.Pos(),
		Dim: g.grid.players[id].Profile.Dim(),
	}
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
	objs := make(map[int]ObjectInitData, len(g.grid.objects))

	for id, obj := range(g.grid.objects) {
		objs[id] = ObjectInitData {
			Pos: obj.Profile.Pos(),
			Dim: obj.Profile.Dim(),
		}
	}

	return ObjectInitMsg{
		T: objectInitType,
		Os: objs,
	}
}

func (g *Game) createGameStateMsg() GameStateMsg {
	msg := GameStateMsg{
		T: gameStateType,
		S: g.updates,
		Ps: make(map[int]PlayerData, 0),
		Os: make(map[int]ObjectData, 0),
		Ss: make([]ShotData, 0),
	}

	if g.updateBuffer == nil {
		return msg
	}

	msg.Ps = g.updateBuffer.players
	msg.Os = g.updateBuffer.objects
	msg.Ss = g.updateBuffer.shots
	return msg
}