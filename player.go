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
	maxHorizontalVel = 10.0
	maxDownwardVel = -24.0
	maxVelMultiplier = 0.9
	extVelMultiplier = 0.98

	jumpVel = 10.0

	friction = 0.4
	airResistance = 0.92

	maxJumpFrames int = 20
	maxCanJumpFrames int = 6
)

type Player struct {
	*Object

	weapon *Weapon
	altWeapon *Weapon

	canDash bool
	jumpFrames int
	canJumpFrames int
	grounded bool
	walled int

	ignoredColliders map[SpacedId]bool

	keys map[KeyType]bool
	// Keys held down during last update cycle
	lastKeys map[KeyType] bool
	lastKeyUpdate SeqNumType

	mouse Vec2
	dir Vec2
}

func NewPlayer(init Init) *Player {
	// subProfiles := make([]Profile, 1)
	// subProfiles[0] = NewRec2(NewVec2(0, 1), init.Dim())
	player := &Player {
		Object: NewObject(init, NewRec2(init, NewProfileData(true))),

		weapon: NewWeapon(init.GetId(), spaceBurst),
		altWeapon: NewWeapon(init.GetId(), spaceBlast),

		canDash: true,
		jumpFrames: 0,
		canJumpFrames: 0,
		grounded: false,
		walled: 0,

		ignoredColliders: make(map[SpacedId]bool, 0),

		keys: make(map[KeyType]bool, 0),
		lastKeys: make(map[KeyType]bool, 0),
		lastKeyUpdate: 0,
		dir: init.Pos(),
	}
	player.respawn()
	return player
}

func (p *Player) GetData() Data {
	data := NewPlayerData()
	data.Merge(p.GetProfile().GetData())

	data.Set(dirProp, p.dir)
	data.Set(keysProp, p.keys)

	if (debugMode) {
		data.Set(profilePosProp, p.GetProfile().Pos())
		data.Set(profileDimProp, p.GetProfile().Dim())
	}

	return data
}

func (p *Player) SetData(data Data) {
	p.GetProfile().SetData(data)

	if data.Has(keysProp) {
		p.keys = data.Get(keysProp).(map[KeyType]bool)
	}
	if data.Has(dirProp) {
		p.dir = data.Get(dirProp).(Vec2)
	}
}

func (p *Player) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	ts := GetTimestep(now, p.lastUpdateTime)
	if ts < 0 {
		return false
	}
	p.lastUpdateTime = now

	pos := p.GetProfile().Pos()
	vel := p.GetProfile().Vel()
	evel := p.GetProfile().ExtVel()
	acc := p.GetProfile().Acc()

	if (p.health <= 0 || pos.Y < -5) {
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

	p.GetProfile().SetAcc(acc)

	// Shooting & recoil
	p.updateDir()
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

	// Grounded actions
	if p.grounded {
		p.canJumpFrames = maxCanJumpFrames
		p.canDash = true

		// Friction
		if Sign(acc.X) != Sign(vel.X) {
			vel.X *= friction
		}
	} else {
		p.canJumpFrames -= 1
	}

	// Jump & double jump
	if p.jumpFrames > 0 {
		p.jumpFrames -= 1
	}
	if p.keyPressed(dashKey) {
		if p.canJumpFrames > 0 {
			p.canJumpFrames = 0
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

	p.GetProfile().SetVel(vel)

	// Slow down momentum from other objects if not grounded
	if !p.grounded {
		evel.X *= extVelMultiplier
		evel.Y = 0
	}
	p.GetProfile().SetExtVel(evel)

	// Move
	pos.Add(p.GetProfile().TotalVel(), ts)
	p.GetProfile().SetPos(pos)
	p.checkCollisions(grid)

	// Save state
	p.lastKeys = p.keys

	return true
}

func (p *Player) shoot(w *Weapon, key KeyType, grid *Grid, now time.Time) *Shot {
	if w.bursting(now) || p.keyDown(key) && w.canShoot(now) {
		line := NewLine(p.GetProfile().Pos(), p.dir)
		return w.shoot(line, grid, now)
	}
	return nil
}

func (p *Player) checkCollisions(grid *Grid) {
	// Collision detection
	ignoredColliders := make(map[SpacedId]bool, 0)
	p.grounded, p.walled = false, 0
	colliders := grid.GetColliders(p.GetProfile(), ColliderOptions {self: p.GetSpacedId(), solidOnly: true})
	for len(colliders) > 0 {
		thing := PopThing(&colliders)

		if ignored, ok := p.ignoredColliders[thing.GetSpacedId()]; ok && ignored {
			ignoredColliders[thing.GetSpacedId()] = true
			continue
		}

		other := thing.GetProfile()
		results := p.GetProfile().Snap(other)
		
		if !results.snap {
			if results.ignored {
				ignoredColliders[thing.GetSpacedId()] = true
			}
			continue
		}

		pos := p.GetProfile().Pos()
		pos.Add(results.posAdj, 1.0)
		p.GetProfile().SetPos(pos)
		if results.posAdj.X != 0 {
			// p.walled = -int(Sign(results.posAdj.X))
		}
		if results.posAdj.Y > 0 {
			p.GetProfile().SetExtVel(other.TotalVel())
			p.grounded = true
		}

		p.GetProfile().SetVel(results.newVel)
	}
	p.ignoredColliders = ignoredColliders

	colliders = grid.GetColliders(p.GetProfile(), ColliderOptions {self: p.GetSpacedId()})
	for len(colliders) > 0 {
		collider := PopThing(&colliders)
		other := collider.GetProfile()
		if p.GetProfile().Overlap(other) <= 0 {
			continue
		}

		switch object := collider.(type) {
		case *Explosion:
			object.Hit(p)
		}
	}
}

func (p *Player) respawn() {
	p.health = 100
	p.canDash = true

	rand.Seed(time.Now().Unix())
	p.GetProfile().SetPos(NewVec2(float64(1 + rand.Intn(19)), 20))
	p.GetProfile().SetVel(NewVec2(0, 0))
	p.GetProfile().SetAcc(NewVec2(0, 0))
}

func (p *Player) updateKeys(keyMsg KeyMsg) {
	if keyMsg.S < p.lastKeyUpdate {
		return
	}
	p.lastKeyUpdate = keyMsg.S
	keys := make(map[KeyType]bool)
	for _, key := range(keyMsg.K) {
		keys[key] = true
	}
	p.keys = keys

	p.updateMouse(keyMsg.M)
}

func (p *Player) updateMouse(mouse Vec2) {
	p.mouse = mouse
	p.updateDir()
}

func (p *Player) updateDir() {
	p.dir = p.mouse
	p.dir.Sub(p.GetProfile().Pos(), 1.0)
	p.dir.Normalize()
}

func (p *Player) keyDown(key KeyType) bool {
	return p.keys[key]
}

func (p *Player) keyPressed(key KeyType) bool {
	return p.keys[key] && !p.lastKeys[key]
}