package main

import (
	"time"
)

const (
	gravityAcc = -18.0
	walledAcc = -9.0
	downAcc = -10.0
	rightAcc = 16.0
	leftAcc = -rightAcc
	turnMultiplier = 4.0

	maxUpwardVel = 8.0
	maxHorizontalVel = 8.0
	maxDownwardVel = -24.0
	maxVelMultiplier = 0.9

	dashVel = 12.0
	jumpVel = 12.0

	friction = 0.4
	airResistance = 0.92
)

type PlayerInitData struct {
	Init
}

func NewPlayerInitData(id int, pos Vec2, dim Vec2) PlayerInitData {
	return PlayerInitData {
		Init {
			Id: id,
			Pos: pos,
			Dim: dim,
		},
	}
}

type Player struct {
	Profile
	id int
	weapon *Weapon
	lastUpdateTime time.Time

	canDash bool
	grounded bool
	walled int

	keys map[int]bool
	// Keys held down during last update cycle
	lastKeys map[int] bool
	lastKeyUpdate int
	mouse Vec2
}

func NewPlayer(initData PlayerInitData) *Player {
	player := &Player {
		Profile: NewRec2(initData.Init.Pos, initData.Init.Dim),
		id: initData.Init.Id,
		weapon: NewWeapon(initData.Init.Id),
		lastUpdateTime: time.Time{},

		canDash: true,
		grounded: false,
		walled: 0,

		keys: make(map[int]bool, 0),
		lastKeys: make(map[int]bool, 0),
		lastKeyUpdate: -1,
		mouse: initData.Pos,
	}
	player.respawn()
	return player
}

type PlayerData struct {
	Pos Vec2
	Vel Vec2
	EVel Vec2
	Acc Vec2
	Dir Vec2
}

func (p *Player) GetProfile() Profile {
	return p.Profile
}

func (p *Player) GetSpacedId() SpacedId {
	return Id(playerIdSpace, p.id)
}

func (p *Player) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	ts := GetTimestep(now, p.lastUpdateTime)
	if ts < 0 {
		return false
	}
	p.lastUpdateTime = now

	pos := p.Profile.Pos()
	vel := p.Profile.Vel()
	acc := p.Profile.Acc()

	if (pos.Y < -5) {
		p.respawn()
		return true
	}

	// Gravity & air resistance
	acc.Y = gravityAcc
	if !p.grounded {
		if vel.Y > 0 && !p.keyDown(dashKey) || vel.Y <= 0 {
			acc.Y += downAcc
		}
		if acc.X == 0 {
			vel.X *= airResistance
		}
	}

	// Wall sliding
	if p.walled != 0 && vel.Y < 0 {
		acc.Y = Max(acc.Y, walledAcc)
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

	// Shooting & recoil
	if p.keyDown(mouseClick) && !p.weapon.reloading(now) {
		line := NewLine(p.Profile.Pos(), p.mouse)
		shot := p.weapon.shoot(line, grid, now)

		if shot != nil {
			buffer.rawShots = append(buffer.rawShots, shot)
			acc.Add(shot.recoil, 1)
		}
	}
	p.Profile.SetAcc(acc)

	// Jumping
	if p.grounded {
		p.canDash = true

		// Friction
		if Sign(acc.X) != Sign(vel.X) {
			vel.X *= friction
		}
	}

	// Jump & double jump
	if p.keyPressed(dashKey) {
		if p.grounded {
			acc.Y = 0
			vel.Y = Max(0, vel.Y) + jumpVel
		} else if p.canDash {
			acc.Y = 0
			vel.Y = jumpVel
			p.canDash = false
		}
	}

	// Calculate & clamp speed
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
	p.Profile.SetVel(vel)

	// Move
	pos.Add(p.Profile.TotalVel(), ts)
	p.Profile.SetPos(pos)
	p.checkCollisions(grid, ts)

	// Save state
	p.lastKeys = p.keys

	return true
}

func (p *Player) checkCollisions(grid *Grid, ts float64) {
	// Collision detection
	p.grounded, p.walled = false, 0
	colliders := grid.getColliders(p.Profile)
	for len(colliders) > 0 {
		switch collider := PopThing(&colliders).(type) {
		case *Object:
			other := collider.GetProfile()
			if !p.Profile.Overlap(other) {
				continue
			}

			xadj, yadj := p.Profile.Snap(other, ts)
			if xadj != 0 {
				p.walled = -int(Sign(xadj))
			}
			if yadj > 0 {
				p.grounded = true
				p.Profile.SetExtVel(NewVec2(other.Vel().X, other.Vel().Y))
			} else {
				p.Profile.SetExtVel(NewVec2(0, 0))
			}
		default:
			continue
		}
	}
}

func (p *Player) getPlayerData() PlayerData {
	return PlayerData {
		Pos: p.Profile.Pos(),
		Vel: p.Profile.Vel(),
		EVel: p.Profile.ExtVel(),
		Acc: p.Profile.Acc(),
		Dir: p.mouse,
	}
}

func (p *Player) setPlayerData(data PlayerData) {
	prof := p.Profile
	prof.SetPos(data.Pos)
	prof.SetVel(data.Vel)
	prof.SetExtVel(data.EVel)
	prof.SetAcc(data.Acc)
	p.mouse = data.Dir
}

func (p *Player) respawn() {
	p.Profile.SetPos(NewVec2(10, 12))
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

	p.updateMouse(keyMsg.M)
}

func (p *Player) updateMouse(mouseWorld Vec2) {
	p.mouse = mouseWorld
	p.mouse.Sub(p.Profile.Pos(), 1.0)
	p.mouse.Normalize()
}

func (p *Player) keyDown(key int) bool {
	return p.keys[key]
}

func (p *Player) keyPressed(key int) bool {
	return p.keys[key] && !p.lastKeys[key]
}