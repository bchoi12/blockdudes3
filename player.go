package main

import (
	"container/heap"
	"math"
	"time"
)

const (
	gravityAcc = -15.0
	walledAcc = -9.0
	downAcc = -10.0
	rightAcc = 16.0
	leftAcc = -rightAcc
	turnMultiplier = 3.0

	maxUpwardVel = 8.0
	maxHorizontalVel = 8.0
	maxDownwardVel = -24.0
	maxVelMultiplier = 0.9

	dashVel = 16.0

	jumpVel float64 = 8.0
	wallJumpVel = 5.2
	wallJumpMultiplier = 0.64

	friction = 0.4
	airResistance = 0.92
)

type Player struct {
	Profile
	id int
	weapon *Weapon
	lastUpdateTime time.Time

	canDash bool
	grounded bool
	walled int
	lastWallJump int
	wallJumps int

	keys map[int]bool
	// Keys held down during last update cycle
	lastKeys map[int] bool
	lastKeyUpdate int
	mouse Vec2
}

type PlayerInitData struct {
	Pos Vec2
	Dim Vec2
}

type PlayerData struct {
	Pos Vec2
	Vel Vec2
	Acc Vec2

	Dir Vec2
}

func NewPlayer(id int, initData PlayerInitData) *Player {
	return &Player {
		Profile: NewRec2(initData.Pos, initData.Dim),
		id: id,
		weapon: NewWeapon(id),
		lastUpdateTime: time.Time{},

		canDash: true,
		grounded: false,
		walled: 0,
		lastWallJump: 0,
		wallJumps: 0,

		keys: make(map[int]bool, 0),
		lastKeys: make(map[int]bool, 0),
		lastKeyUpdate: -1,
		mouse: initData.Pos,
	}
}

func (p *Player) getPlayerData() PlayerData {
	dir := p.mouse
	dir.Sub(p.Profile.Pos(), 1.0)
	dir.Normalize()
	return PlayerData {
		Pos: p.Profile.Pos(),
		Vel: p.Profile.Vel(),
		Acc: p.Profile.Acc(),
		Dir: dir,
	}
}

func (p *Player) respawn() {
	p.Profile.SetPos(NewVec2(5, 5))
	p.Profile.SetVel(NewVec2(0, 0))
	p.Profile.SetAcc(NewVec2(0, 0))
}

func (p *Player) updateKeys(keyMsg KeyMsg) {
	if keyMsg.S <= p.lastKeyUpdate {
		return
	}
	p.lastKeyUpdate = keyMsg.S

	keys := make(map[int]bool, len(keyMsg.K))
	for _, key := range(keyMsg.K) {
		keys[key] = true
	}
	p.keys = keys
	p.mouse = keyMsg.M
}

func (p *Player) keyDown(key int) bool {
	return p.keys[key]
}

func (p *Player) keyPressed(key int) bool {
	return p.keys[key] && !p.lastKeys[key]
}

func (p *Player) updateState(grid *Grid, buffer *UpdateBuffer, now time.Time) {
	var timeStep time.Duration
	if p.lastUpdateTime.IsZero() {
		timeStep = 0
	} else {
		timeStep = now.Sub(p.lastUpdateTime)
	}
	p.lastUpdateTime = now

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
		if vel.Y <= 0 {
			acc.Y += downAcc
		}
		if p.keyDown(downKey) {
			acc.Y += downAcc
		}
		if acc.X == 0 {
			vel.X *= airResistance
		}
	}
	// Shooting
	if p.keyDown(mouseClick) && !p.weapon.reloading(now) {
		mouse := p.mouse
		mouse.Sub(p.Profile.Pos(), 1.0)
		line := NewLine(p.Profile.Pos(), mouse)
		shot := p.weapon.shoot(line, grid, now)

		if shot != nil {
			buffer.shots = append(buffer.shots, shot.getShotData())
			acc.Add(shot.recoil, 1)
		}
	}

	// Stopping
	if p.grounded {
		vel.Y = 0
		p.wallJumps = 0
		p.canDash = true

		// Friction
		if Dot(vel, acc) <= 0 {
			vel.Scale(friction)
		}
	}
	if p.walled != 0 && vel.Y < 0 {
		acc.Y = Max(acc.Y, walledAcc)
	}

	// Calculate velocity & position
	vel.Add(acc, ts)
	if Abs(vel.X) > maxHorizontalVel {
		vel.X *= maxVelMultiplier
	}
	if vel.Y < maxDownwardVel {
		vel.Y *= maxVelMultiplier
	}
	if vel.Y > maxUpwardVel {
		vel.Y *= maxVelMultiplier
	}

	// Instantaneous adjustments
	if p.keyDown(upKey) {
		if p.grounded {
			vel.Y = jumpVel
		} else if p.walled != 0 && p.keyPressed(upKey) {
			if p.wallJumps > 0 && p.lastWallJump != p.walled {
				p.wallJumps = 0
			}
			vel.Y = Max(vel.Y, math.Pow(wallJumpMultiplier, float64(p.wallJumps)) * wallJumpVel)
			vel.X = float64(-Sign(float64(p.walled))) * wallJumpVel * 2.0
			acc.X = 0

			p.wallJumps += 1
			p.lastWallJump = p.walled
		}
	}

	if p.keyPressed(dashKey) && !p.grounded && p.canDash {
		dash := NewVec2(0, 0)
		if p.keyDown(leftKey) {
			dash.X -= dashVel
		}
		if p.keyDown(rightKey) {
			dash.X += dashVel
		}
		if p.keyDown(upKey) {
			dash.Y += dashVel
		}
		if p.keyDown(downKey) {
			dash.Y -= dashVel
		}
		if !dash.IsZero() {
			vel = dash
			p.canDash = false
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
			p.walled = -int(Sign(xadj))
		}
		if yadj > 0 {
			p.grounded = true
		}
	}

	buffer.players[p.id] = p.getPlayerData()

	// Save state
	p.lastKeys = p.keys
}
