package main

import (
	"time"
)

type Game struct {
	players map[int]*Player
	objects map[int]*Object
	grid *Grid

	lastUpdateTime time.Time
}

func newGame() *Game {
	game := &Game {
		players: make(map[int]*Player, 0),
		objects: make(map[int]*Object, 0),
		grid: newGrid(),
	}

	game.loadTestMap()
	return game
}

type Object struct {
	Profile
	static bool
}

type ObjectInitData struct {
	Pos Vec2
	Dim Vec2
}

type ObjectData struct {
	Pos Vec2
}

func (g *Game) addPlayer(id int) {
	g.players[id] = &Player {
		Profile: &Rec2 {
			pos: Vec2 {
				X: 0,
				Y: 0,
			},
			dim: Vec2 {
				X: 1.0,
				Y: 1.0,
			},
		},
		keys: make(map[int]bool, 0),
	}
}

func (g *Game) hasPlayer(id int) bool {
	_, ok := g.players[id]
	return ok
}

func (g *Game) deletePlayer(id int) {
	delete(g.players, id)
}

func (g *Game) processKeyMsg(id int, keyMsg KeyMsg) {
	keys := make(map[int]bool, len(keyMsg.K))
	for _, key := range(keyMsg.K) {
		keys[key] = true
	}
	g.updateKeys(id, keys)
}

func (g *Game) pressKey(id int, key int) {
	p := g.players[id]
	p.keys[key] = true
}

func (g *Game) releaseKey(id int, key int) {
	p := g.players[id]
	delete(p.keys, key)
}

func (g *Game) updateKeys(id int, keys map[int]bool) {
	p := g.players[id]
	p.keys = keys
}

func (g *Game) setPlayerData(id int, data PlayerData) {
	prof := g.players[id].Profile

	prof.SetPos(data.Pos)
	prof.SetVel(data.Vel)
	prof.SetAcc(data.Acc)
}

func (g *Game) updateState() {
	var timeStep time.Duration
	if g.lastUpdateTime.IsZero() {
		timeStep = 0
	} else {
		timeStep = time.Now().Sub(g.lastUpdateTime)
	}
	g.lastUpdateTime = time.Now()

	for _, p := range(g.players) {
		p.updateState(g.grid, timeStep)
	}
}

func (g *Game) loadTestMap() {
	for i := 0; i < 10; i++ {
		g.objects[i] = &Object {
			Profile: &Rec2 {
				pos: Vec2 {
					X: float64(i - 5),
					Y: float64(-i/2),
				},
				dim: Vec2 {
					X: 1.0,
					Y: 1.0,
				},
			},
			static: true,
		}
	}

	for i := 0; i < 10; i++ {
		g.objects[i + 10] = &Object {
			Profile: &Rec2 {
				pos: Vec2 {
					X: 5.0,
					Y: float64(i),
				},
				dim: Vec2 {
					X: 1.0,
					Y: 1.0,
				},
			},
			static: true,
		}
	}

	for i := 0; i < 10; i++ {
		g.objects[i + 20 ] = &Object {
			Profile: &Rec2 {
				pos: Vec2 {
					X: 2.0,
					Y: float64(i + 1),
				},
				dim: Vec2 {
					X: 1.0,
					Y: 1.0,
				},
			},
			static: true,
		}
	}

	g.grid.setObjects(g.objects)
}

func (g *Game) createObjectInitMsg() ObjectInitMsg {
	objs := make(map[int]ObjectInitData, len(g.objects))

	for id, obj := range(g.objects) {
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

func (g *Game) createPlayerStateMsg() PlayerStateMsg {
	msg := PlayerStateMsg{
		T: playerStateType,
		TS: time.Now().UnixNano() / 1000,
		Ps: make(map[int]PlayerData, 0),
	}

	for id, p := range(g.players) {
		msg.Ps[id] = PlayerData {
			Pos: p.Profile.Pos(),
			Vel: p.Profile.Vel(),
			Acc: p.Profile.Acc(),
		}
	}

	return msg
}