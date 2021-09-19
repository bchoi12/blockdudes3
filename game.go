package main

import (
	"time"
)

const (
	maxChatMsgs int = 16
)

type Game struct {
	players map[int]*Player
	objects map[int]*Object
	grid map[int]map[int]*Object

	chatQueue []ChatMsg

	lastUpdateTime time.Time
	updateInterval time.Duration
}

func newGame() *Game {
	game := &Game {
		players: make(map[int]*Player, 0),
		objects: make(map[int]*Object, 0),
		grid: make(map[int]map[int]*Object, 0),

		chatQueue: make([]ChatMsg, 0),
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

func (g *Game) addPlayer(c *Client) {
	g.players[c.id] = &Player {
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

func (g *Game) deletePlayer(c *Client) {
	delete(g.players, c.id)
}

func (g *Game) addChatMsg(chatMsg ChatMsg) {
	g.chatQueue = append(g.chatQueue, chatMsg)
	if (len(g.chatQueue) > maxChatMsgs) {
		g.chatQueue = g.chatQueue[1:maxChatMsgs + 1]
	}
}

func (g *Game) updateKeys(id int, keyMsg KeyMsg) {
	p := g.players[id]
	p.keys = make(map[int]bool, len(keyMsg.K))
	for _, key := range(keyMsg.K) {
		p.keys[key] = true
	}
	p.setState()
}

func (g *Game) updateState() {
	var timeStep time.Duration
	if g.lastUpdateTime.IsZero() {
		timeStep = 0
	} else {
		timeStep = time.Now().Sub(g.lastUpdateTime)
	}
	g.lastUpdateTime = time.Now()
	g.updateInterval = timeStep

	for _, p := range(g.players) {
		p.updateState(timeStep)
	}

	// TODO: collisions with the grid
	for _, p := range(g.players) {
		for _, obj := range(g.objects) {
			if p.Profile.Overlap(obj.Profile) {
				p.Profile.Snap(obj.Profile)
			}
		}
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
		Int: int(g.updateInterval / time.Millisecond),
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