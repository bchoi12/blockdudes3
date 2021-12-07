package main

import (
	"math/rand"
	"time"
)

const (
	gravityAcc = -18.0
	walledAcc = -9.0
	downAcc = -18.0
	rightAcc = 16.0
	leftAcc = -rightAcc
	turnMultiplier = 4.0

	maxUpwardVel = 10.0
	maxHorizontalVel = 8.0
	maxDownwardVel = -24.0
	maxVelMultiplier = 0.9
	extVelMultiplier = 0.98

	jumpVel = 10.0

	friction = 0.4
	airResistance = 0.92

	maxJumpFrames int = 20
)

type Player struct {
	Object

	weapon *Weapon
	altWeapon *Weapon

	canDash bool
	jumpFrames int
	grounded bool
	walled int

	keys map[KeyType]bool
	// Keys held down during last update cycle
	lastKeys map[KeyType] bool
	lastKeyUpdate SeqNumType
	mouse Vec2
}

func NewPlayer(init Init) *Player {
	player := &Player {
		Object: Object {
			Init: init,
			Profile: NewRec2(init.Pos, init.Dim),
		},

		weapon: NewWeapon(init.Id, spaceBurst),
		altWeapon: NewWeapon(init.Id, spaceBlast),

		canDash: true,
		jumpFrames: 0,
		grounded: false,
		walled: 0,

		keys: make(map[KeyType]bool, 0),
		lastKeys: make(map[KeyType]bool, 0),
		lastKeyUpdate: 0,
		mouse: init.Pos,
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

func (p *Player) GetData() ObjectData {
	od := NewObjectData()
	od.Set(posProp, p.Profile.Pos())
	od.Set(velProp, p.Profile.Vel())
	od.Set(extVelProp, p.Profile.ExtVel())
	od.Set(accProp, p.Profile.Acc())
	od.Set(dirProp, p.mouse)
	return od
}

func (p *Player) SetData(od ObjectData) {
	p.Profile.SetData(od)

	if od.Has(dirProp) {
		p.mouse = od.Get(dirProp).(Vec2)
	}
}

func (p *Player) TakeHit(shot *Shot, hit *Hit) {
	p.health -= 20
	if p.health <= 0 {
		p.respawn()
	}

	vel := p.Profile.Vel()
	force := shot.line.R
	force.Normalize()
	vel.Add(force, shot.weapon.pushFactor)
	p.Profile.SetVel(vel)
}

func (p *Player) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	ts := GetTimestep(now, p.lastUpdateTime)
	if ts < 0 {
		return false
	}
	p.lastUpdateTime = now

	lastPos := p.Profile.Pos()
	pos := p.Profile.Pos()
	vel := p.Profile.Vel()
	evel := p.Profile.ExtVel()
	acc := p.Profile.Acc()

	if (pos.Y < -5) {
		p.respawn()
		return true
	}

	// Gravity & air resistance
	acc.Y = gravityAcc
	if !p.grounded {
		if p.jumpFrames == 0 || !p.keyDown(dashKey) || vel.Y <= 0 {
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

	p.Profile.SetAcc(acc)

	// Grounded actions
	if p.grounded {
		p.canDash = true

		// Friction
		if Sign(acc.X) != Sign(vel.X) {
			vel.X *= friction
		}
	}

	// Jump & double jump
	if p.jumpFrames > 0 {
		p.jumpFrames -= 1
	}
	if p.keyPressed(dashKey) {
		if p.grounded {
			acc.Y = 0
			vel.Y = Max(0, vel.Y) + jumpVel
			p.jumpFrames = maxJumpFrames
		} else if p.canDash {
			acc.Y = 0
			vel.Y = jumpVel
			p.canDash = false
			p.jumpFrames = maxJumpFrames
		}
	}

	// Shooting & recoil
	var shot *Shot
	shot = p.shoot(p.weapon, mouseClick, grid, now)
	if shot != nil {
		buffer.rawShots = append(buffer.rawShots, shot)
		vel.Add(shot.recoil, 1)

		if p.grounded {
			vel.Y = Max(0, vel.Y)
		}
		if p.walled == -1 {
			vel.X = Max(0, vel.X)
		}
		if p.walled == 1 {
			vel.X = Min(vel.X, 0)
		}
	} else {
		shot = p.shoot(p.altWeapon, altMouseClick, grid, now)
		if shot != nil {
			buffer.rawShots = append(buffer.rawShots, shot)
			vel.Add(shot.recoil, 1)
		}
		if p.grounded {
			vel.Y = Max(0, vel.Y)
		}
		if p.walled == -1 {
			vel.X = Max(0, vel.X)
		}
		if p.walled == 1 {
			vel.X = Min(vel.X, 0)
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

	// Slow down momentum from other objects if not grounded
	if !p.grounded {
		evel.X *= extVelMultiplier
		evel.Y = 0
	}
	p.Profile.SetExtVel(evel)

	// Move
	pos.Add(p.Profile.TotalVel(), ts)
	p.Profile.SetPos(pos)
	p.checkCollisions(grid, lastPos)

	// Save state
	p.lastKeys = p.keys

	return true
}

func (p *Player) shoot(w *Weapon, key KeyType, grid *Grid, now time.Time) *Shot {
	if w.bursting(now) || p.keyDown(key) && w.canShoot(now) {
		line := NewLine(p.Profile.Pos(), p.mouse)
		return w.shoot(line, grid, now)
	}
	return nil
}

func (p *Player) checkCollisions(grid *Grid, lastPos Vec2) {
	// Collision detection
	p.grounded, p.walled = false, 0
	colliders := grid.getColliders(p.Profile)
	for len(colliders) > 0 {
		switch collider := PopThing(&colliders).(type) {
		case *Object:
			other := collider.GetProfile()
			if p.Profile.Overlap(other) <= 0 {
				continue
			}

			if collider.GetSpace() == explosionSpace {
				dir := p.Profile.Pos()
				dir.Sub(other.Pos(), 1.0)
				if (dir.IsZero()) {
					dir.X = 1
				}
				dir.Normalize()
				dir.Scale(20)
				dir.Add(p.Profile.Vel(), 1.0)
				p.Profile.SetVel(dir)
			}

			xadj, yadj := p.Profile.Snap(other, lastPos)
			if xadj != 0 {
				p.walled = -int(Sign(xadj))
			}
			if yadj > 0 {
				p.grounded = true
				p.Profile.SetExtVel(NewVec2(other.Vel().X, other.Vel().Y))
			}
		default:
			continue
		}
	}
}

func (p *Player) respawn() {
	p.health = 100

	rand.Seed(time.Now().Unix())
	p.Profile.SetPos(NewVec2(float64(1 + rand.Intn(19)), 20))
	p.Profile.SetVel(NewVec2(0, 0))
	p.Profile.SetAcc(NewVec2(0, 0))
}

func (p *Player) updateKeys(keyMsg KeyMsg) {
	if keyMsg.S <= p.lastKeyUpdate {
		return
	}
	p.lastKeyUpdate = keyMsg.S
	keys := make(map[KeyType]bool, len(keyMsg.K))
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

func (p *Player) keyDown(key KeyType) bool {
	return p.keys[key]
}

func (p *Player) keyPressed(key KeyType) bool {
	return p.keys[key] && !p.lastKeys[key]
}