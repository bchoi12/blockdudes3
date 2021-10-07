package main

import (
	"container/heap"
	"math"
	"time"
)

const (
	jumpVel float64 = 6.6
	wallJumpVel float64 = 5.2
	wallJumpMultiplier float64 = 0.64
	gravityAcc = -10.0

	downAcc float64 = -10.0
	maxVerticalVel = 20.0

	leftAcc float64 = -20.0
	rightAcc float64 = -leftAcc
	turnMultiplier float64 = 2.5
	maxHorizontalVel = 7.2

	minStopSpeedSquared float64 = 0.15 * 0.15

	friction float64 = 0.4
)

type Player struct {
	Profile

	grounded bool
	walled int
	lastWallJump int
	wallJumps int

	keys map[int]bool
	lastKeys map[int] bool
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

		grounded: false,
		walled: 0,
		lastWallJump: 0,
		wallJumps: 0,

		keys: make(map[int]bool, 0),
		lastKeys: make(map[int]bool, 0),
	}
}

func (p *Player) respawn() {
	p.Profile.SetPos(NewVec2(0, 0))
	p.Profile.SetVel(NewVec2(0, 0))
	p.Profile.SetAcc(NewVec2(0, 0))
}

func (p *Player) keyDown(key int) bool {
	return p.keys[key]
}

func (p *Player) keyPressed(key int) bool {
	return p.keys[key] && !p.lastKeys[key]
}

// delete?
func (p *Player) checkCollision(grid *Grid, acc Vec2, ts float64) ObjectHeap {
	prof := p.Profile
	vel := NewVec2(0, 0)
	vel.Add(acc, ts)
	vel.Scale(ts)
	prof.AddPos(vel)
	return grid.getColliders(prof)
}

func (p *Player) updateState(grid *Grid, timeStep time.Duration) {
	ts := float64(timeStep) / float64(time.Second)

	pos := p.Profile.Pos()
	vel := p.Profile.Vel()
	acc := p.Profile.Acc()

	if (pos.Y < -5) {
		p.respawn()
		return
	}

	// Left & right
	if p.keyDown(leftKey) != p.keyDown(rightKey) {
		if p.keyDown(leftKey) {
			acc.X = leftAcc
		} else {
			acc.X = rightAcc
		}
		if Sign(acc.X) == -Sign(vel.X) {
			acc.X *= turnMultiplier
		}
	} else {
		acc.X = 0
	}

	// Gravity & friction
	acc.Y = gravityAcc
	if !p.grounded {
		if vel.Y > 0 && !p.keyDown(upKey) {
			acc.Y += downAcc
		}
		if vel.Y < 0 {
			acc.Y += downAcc
		}
		if p.keyDown(downKey) {
			acc.Y += downAcc
		}
	} else {
		// Friction
		if Dot(vel, acc) <= 0 {
			vel.Scale(friction)
		}
	}

	// Stopping
	if acc.IsZero() && vel.LenSquared() <= minStopSpeedSquared {
		vel.Scale(0)
	}

	// Calculate velocity & position
	vel.Add(acc, ts)
	vel.ClampX(-maxHorizontalVel, maxHorizontalVel)
	vel.ClampY(-maxVerticalVel, maxVerticalVel)

	// Instantaneous adjustments
	if p.grounded {
		vel.Y = 0
		p.wallJumps = 0
	}
	if p.keyDown(upKey) {
		if p.grounded {
			vel.Y = jumpVel
		} else if p.walled != 0 && p.keyPressed(upKey) {
			if p.wallJumps > 0 && p.lastWallJump != p.walled {
				p.wallJumps = 0
			}
			vel.Y = math.Pow(wallJumpMultiplier, float64(p.wallJumps)) * wallJumpVel
			vel.X = float64(-Sign(acc.X)) * wallJumpVel * 2.0
			acc.X = 0

			p.wallJumps += 1
			p.lastWallJump = p.walled
		}
	}

	// Move
	pos.Add(vel, ts)
	p.Profile.SetPos(pos)
	p.Profile.SetVel(vel)
	p.Profile.SetAcc(acc)

	// Collision detection
	p.grounded, p.walled = false, 0
	colliders := grid.getColliders(p.Profile)
	for len(colliders) > 0 {
		objectItem := heap.Pop(&colliders).(*ObjectItem)
		collider := objectItem.object

		if !p.Profile.Overlap(collider.Profile) {
			continue
		}
		xadj, yadj := p.Profile.Snap(collider.Profile)
		if xadj != 0 {
			p.walled = int(Sign(xadj))
		}
		if yadj > 0 {
			p.grounded = true
		}
	}

	// Save state
	p.lastKeys = p.keys
}
