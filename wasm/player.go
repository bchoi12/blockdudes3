package main

import (
	"time"
)

const (
	upKey int = 1
	downKey int = 2
	leftKey int = 3
	rightKey int = 4

	upAcc float64 = 16.0
	downAcc float64 = -upAcc
	maxVerticalVel = 6.0

	leftAcc float64 = -16.0
	rightAcc float64 = -leftAcc
	maxHorizontalVel = 6.0

	minStopSpeedSquared float64 = 0.15 * 0.15

	friction float64 = 0.85
)

type Player struct {
	Profile

	keys map[int]bool
}

type PlayerInitData struct {
	Pos Vec2
	Dim Vec2
}

type PlayerData struct {
	Pos Vec2
	Vel Vec2
	Acc Vec2
}

func newPlayer(pos Vec2, dim Vec2) *Player {
	return &Player {
		Profile: &Rec2 {
			pos: pos,
			dim: dim,
		},
		keys: make(map[int]bool, 0),
	}
}

func (p *Player) setState() {
	acc := NewVec2(0, 0)

	if p.keys[upKey] {
		acc.Y += upAcc
	} 
	if p.keys[downKey] {
		acc.Y += downAcc
	}
	if p.keys[leftKey] {
		acc.X += leftAcc
	}
	if p.keys[rightKey] {
		acc.X += rightAcc
	}
	p.Profile.SetAcc(acc)
}

func (p *Player) updateState(timeStep time.Duration) {
	ts := float64(timeStep) / float64(time.Second)

	pos := p.Profile.Pos()
	vel := p.Profile.Vel()
	acc := p.Profile.Acc()

	vel.Add(acc, ts)
	if Dot(vel, acc) <= 0 {
		vel.Scale(friction)
	}

	if acc.IsZero() && vel.LenSquared() <= minStopSpeedSquared {
		vel.Scale(0)
	}

	vel.ClampX(-maxHorizontalVel, maxHorizontalVel)
	vel.ClampY(-maxVerticalVel, maxVerticalVel)
	
	pos.Add(vel, ts)

	p.Profile.SetPos(pos)
	p.Profile.SetVel(vel)
	p.Profile.SetAcc(acc)
}
