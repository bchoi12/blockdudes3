package main

import (
	"time"
)

type Game struct {
	grid *Grid

	updateBuffer *UpdateBuffer
	updates int
}

func newGame() *Game {
	game := &Game {
		grid: NewGrid(),
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
	object := NewObject(initData.Pos, initData.Dim)
	g.grid.addObject(id, object)
}

func (g *Game) setObjects(objectInitData map[int]ObjectInitData) {
	objects := make(map[int]*Object, 0)
	for id, objectInit := range(objectInitData) {
		objects[id] = NewObject(objectInit.Pos, objectInit.Dim)
	}
	g.grid.setObjects(objects)
}

func (g *Game) updateState() {
	g.updateBuffer = NewUpdateBuffer()

	now := time.Now()
	for _, p := range(g.grid.players) {
		p.updateState(g.grid, g.updateBuffer, now)
	}
	g.updates++
}

func (g *Game) loadTestMap() {
	objects := make(map[int]ObjectInitData)

	objects[0] = ObjectInitData {
		Pos: NewVec2(5, 0.9),
		Dim: NewVec2(20.0, 0.2),
	}
	objects[1] = ObjectInitData {
		Pos: NewVec2(10, 8),
		Dim: NewVec2(0.5, 11),
	}
	objects[2] = ObjectInitData {
		Pos: NewVec2(12, 8),
		Dim: NewVec2(0.5, 11),
	}
	g.setObjects(objects)
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
		Ss: make([]ShotData, 0),
	}

	if g.updateBuffer == nil {
		return msg
	}

	msg.Ps = g.updateBuffer.players
	msg.Ss = g.updateBuffer.shots
	return msg
}