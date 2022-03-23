package main

import (
	"math/rand"
	"time"
)

const (
	sqrtHalf float64 = .7071
)

const (
	gravityAcc = -18.0
	downAcc = -18.0
	rightAcc = 16.0
	leftAcc = -rightAcc
	turnMultiplier = 2.0

	maxUpwardVel = 12.0
	maxHorizontalVel = 12.0
	maxDownwardVel = -24.0
	maxVelMultiplier = 0.9
	extVelMultiplier = 0.98
	maxSpeed = 50.0

	jumpVel = 10.0

	friction = 0.4
	airResistance = 0.9

	// TODO: base on time instead of number of frames
	maxJumpFrames int = 20
	maxCanJumpFrames int = 6

	bodySubProfile ProfileKey = 1
)

type Player struct {
	Object
	weapon Weapon

	canDash bool

	jumpFrames int
	canJumpFrames int

	ignoredColliders map[SpacedId]bool

	keys map[KeyType]bool
	// Keys held down during last update cycle
	lastKeys map[KeyType] bool
	lastKeyUpdate SeqNumType

	mouse Vec2
}

func NewPlayer(init Init) *Player {
	profile := NewRec2(init, NewData())
	profile.SetSolid(true)
	profile.SetGuide(true)
	points := make([]Vec2, 4)
	points[0] = NewVec2(0.48, -0.53)
	points[1] = NewVec2(0.48, 0.53)
	points[2] = NewVec2(-0.48, 0.53)
	points[3] = NewVec2(-0.48, -0.53)

	rpInit := init
	rpInit.SetDim(NewVec2(10, 10))

	rotPoly := NewRotPoly(rpInit, NewData(), points)
	subProfile := NewSubProfile(rotPoly)
	subProfile.SetOffset(NewVec2(0, 0.22))
	profile.AddSubProfile(bodySubProfile, subProfile)

	player := &Player {
		Object: NewObject(profile, NewData()),
		weapon: NewWeaponRocket(init.GetSpacedId()),

		canDash: true,
		jumpFrames: 0,
		canJumpFrames: 0,

		ignoredColliders: make(map[SpacedId]bool, 0),

		keys: make(map[KeyType]bool, 0),
		lastKeys: make(map[KeyType]bool, 0),
		lastKeyUpdate: 0,

		mouse: NewVec2(0, 0),
	}
	player.respawn()
	return player
}

func (p *Player) GetData() Data {
	data := NewData()
	data.Merge(p.Object.GetData())

	data.Set(dirProp, p.Dir())
	data.Set(weaponDirProp, p.weapon.Dir())
	data.Set(keysProp, p.keys)

	if (debugMode) {
		data.Set(profilePosProp, p.Pos())
		data.Set(profileDimProp, p.Dim())
		data.Set(profilePointsProp, p.GetSubProfile(bodySubProfile).Profile.(*RotPoly).points)
	}

	return data
}

func (p *Player) SetData(data Data) {
	p.Object.SetData(data)

	if data.Has(keysProp) {
		p.keys = data.Get(keysProp).(map[KeyType]bool)
	}
	if data.Has(dirProp) {
		p.SetDir(data.Get(dirProp).(Vec2))
	}
	if data.Has(weaponDirProp) {
		p.weapon.SetDir(data.Get(weaponDirProp).(Vec2))
	}
}

func (p *Player) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	ts := GetTimestep(now, p.lastUpdateTime)
	if ts < 0 {
		return false
	}
	p.lastUpdateTime = now

	pos := p.Pos()
	vel := p.Vel()
	evel := p.ExtVel()
	acc := p.Acc()
	grounded := p.Grounded()

	if (p.Dead() || pos.Y < -5) {
		p.respawn()
		return true
	}

	// Gravity & air resistance
	acc.Y = gravityAcc
	if !grounded {
		if p.jumpFrames == 0 || vel.Y <= 0 {
			acc.Y += downAcc
		}
		if acc.X == 0 {
			vel.X *= airResistance
		}
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

	p.SetAcc(acc)

	// Grounded actions
	if grounded {
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

	if vel.LenSquared() >= maxSpeed * maxSpeed {
		vel.Normalize()
		vel.Scale(maxSpeed)
	}

	p.SetVel(vel)

	// Slow down momentum from other objects if not grounded
	if !grounded {
		evel.X *= extVelMultiplier
		evel.Y *= extVelMultiplier
	}
	p.SetExtVel(evel)

	// Move
	pos.Add(p.TotalVel(), ts)
	p.SetPos(pos)
	p.checkCollisions(grid)

	// Shooting & recoil
	p.weapon.SetPos(p.GetSubProfile(bodySubProfile).Pos())
	if p.keyDown(mouseClick) {
		p.weapon.PressTrigger(primaryTrigger)
	}
	if p.keyDown(altMouseClick) {
		p.weapon.PressTrigger(secondaryTrigger)
	}
	shots := p.weapon.Shoot(now)
	if len(shots) > 0 {
		buffer.rawShots = append(buffer.rawShots, shots...)
	}

	// Save state
	p.lastKeys = p.keys

	return true
}

func (p *Player) checkCollisions(grid *Grid) {
	colliders := grid.GetColliders(p.GetProfile(), ColliderOptions {self: p.GetSpacedId(), solidOnly: true})
	p.Snap(colliders)

	colliders = grid.GetColliders(p.GetProfile(), ColliderOptions {self: p.GetSpacedId()})
	for len(colliders) > 0 {
		collider := PopThing(&colliders)
		other := collider.GetProfile()

		results := p.Overlap(other)
		if !results.overlap {
			continue
		}

		switch object := collider.(type) {
		case *Explosion:
			object.Hit(p)
		}
	}
}

func (p *Player) respawn() {
	p.SetHealth(100)
	p.canDash = true

	rand.Seed(time.Now().Unix())
	p.SetPos(NewVec2(float64(1 + rand.Intn(19)), 20))
	p.SetVel(NewVec2(0, 0))
	p.SetAcc(NewVec2(0, 0))
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

	dir := keyMsg.D
	lastDir := p.Dir()
	// Note: any changes here should also be done in the frontend
	p.weapon.SetDir(dir)
	// Don't turn around right at dir.X = 0
	if Abs(dir.X) < 0.3 && SignPos(dir.X) != SignPos(lastDir.X) {
		dir.X = FSignPos(lastDir.X) * Abs(dir.X)
	}
	if Abs(dir.X) < sqrtHalf {
		dir.X = sqrtHalf * FSignPos(dir.X)
		dir.Y = sqrtHalf * FSignPos(dir.Y)
	}
	p.SetDir(dir)
}

func (p *Player) keyDown(key KeyType) bool {
	return p.keys[key]
}

func (p *Player) keyPressed(key KeyType) bool {
	return p.keys[key] && !p.lastKeys[key]
}