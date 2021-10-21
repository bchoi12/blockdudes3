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
	object := NewObject(id, initData)
	g.grid.addObject(id, object)
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

func (g *Game) loadTestMap() {
	objects := make(map[int]ObjectInitData)

	i := 0
	objects[i] = ObjectInitData {
		Pos: NewVec2(5, 0.9),
		Dim: NewVec2(20.0, 0.2),
	}

	i++
	objects[i] = ObjectInitData {
		Pos: NewVec2(1, 3),
		Dim: NewVec2(3.0, 0.2),
	}

	i++
	objects[i] = ObjectInitData {
		Pos: NewVec2(4.5, 5),
		Dim: NewVec2(3.0, 0.2),
	}

	g.setObjects(objects)

	i++
	movingPlatform := ObjectInitData {
		Pos: NewVec2(8, 3),
		Dim: NewVec2(3.0, 0.2),
		dynamic: true,
	}
	g.addObject(i, movingPlatform)
	g.grid.objects[i].update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
		switch prof := (o.Profile).(type) {
		case *Rec2:
			pos := prof.Pos()
			vel := prof.Vel()
			if vel.IsZero() {
				vel.X = 1
			}
			if prof.Pos().X > 11 && vel.X > 0 {
				vel.X = -1
			}
			if prof.Pos().X < 4 && vel.X < 0 {
				vel.X = 1
			}
			pos.Add(vel, ts)
			prof.SetVel(vel)
			prof.SetPos(pos)

			grid.updateObject(o.id, o)
			buffer.objects[o.id] = o.getObjectData()
		default:
			return
		}
	}

	i++
	platform2 := ObjectInitData {
		Pos: NewVec2(10, 5),
		Dim: NewVec2(3.0, 0.2),
		dynamic: true,
	}
	g.addObject(i, platform2)
	g.grid.objects[i].update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
		switch prof := (o.Profile).(type) {
		case *Rec2:
			pos := prof.Pos()
			vel := prof.Vel()
			if vel.IsZero() {
				vel.X = 1
			}
			if prof.Pos().X > 14 && vel.X > 0 {
				vel.X = -1
			}
			if prof.Pos().X < 7 && vel.X < 0 {
				vel.X = 1
			}
			pos.Add(vel, ts)
			prof.SetVel(vel)
			prof.SetPos(pos)

			grid.updateObject(o.id, o)
			buffer.objects[o.id] = o.getObjectData()
		default:
			return
		}
	}
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