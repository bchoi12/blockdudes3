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

	rightAcc = 18.0
	leftAcc = -rightAcc
	turnMultiplier = 3.0

	maxUpwardVel = 12.0
	maxHorizontalVel = 12.0
	maxDownwardVel = -24.0
	maxVelMultiplier = 0.9
	extVelMultiplier = 0.98
	maxSpeed = 50.0

	jumpVel = 10.0

	friction = 0.4
	knockbackFriction = 0.9
	airResistance = 0.9

	jumpDuration time.Duration = 300 * time.Millisecond
	jumpGraceDuration time.Duration = 100 * time.Millisecond
	knockbackDuration time.Duration = 150 * time.Millisecond

	bodySubProfile ProfileKey = 1
)

type Player struct {
	BaseObject
	Keys
	weapon Weapon

	canJump bool
	canDash bool

	jumpTimer Timer
	jumpGraceTimer Timer
	knockbackTimer Timer
}

func NewPlayer(init Init) *Player {
	profile := NewRec2(init)
	points := make([]Vec2, 4)
	points[0] = NewVec2(0.48, -0.53)
	points[1] = NewVec2(0.48, 0.53)
	points[2] = NewVec2(-0.48, 0.53)
	points[3] = NewVec2(-0.48, -0.53)

	rotPoly := NewRotPoly(init, points)
	subProfile := NewSubProfile(rotPoly)
	subProfile.SetOffset(NewVec2(0, 0.22))
	profile.AddSubProfile(bodySubProfile, subProfile)

	overlapOptions := NewColliderOptions()
	overlapOptions.SetSpaces(true, wallSpace, pickupSpace)
	profile.SetOverlapOptions(overlapOptions)

	snapOptions := NewColliderOptions()
	snapOptions.SetSpaces(true, wallSpace)
	profile.SetSnapOptions(snapOptions)

	weapon := NewBaseWeapon(init.GetSpacedId())
	weapon.SetWeaponType(uziWeapon)

	player := &Player {
		BaseObject: NewBaseObject(profile),
		Keys: NewKeys(),
		weapon: weapon,

		canJump: false,
		canDash: true,

		jumpTimer: NewTimer(jumpDuration),
		jumpGraceTimer: NewTimer(jumpGraceDuration),
		knockbackTimer: NewTimer(knockbackDuration),
	}
	player.Respawn()
	return player
}

func (p Player) GetInitData() Data {
	data := NewData()
	data.Merge(p.BaseObject.GetInitData())
	data.Merge(p.weapon.GetInitData())
	return data
}

func (p Player) GetData() Data {
	data := NewData()
	data.Merge(p.BaseObject.GetData())
	data.Merge(p.weapon.GetData())

	data.Set(dirProp, p.Dir())
	data.Set(equipDirProp, p.weapon.Dir())
	data.Set(keysProp, p.GetKeys())

	if (debugMode) {
		data.Set(profilePosProp, p.Pos())
		data.Set(profileDimProp, p.Dim())
		data.Set(profilePointsProp, p.GetSubProfile(bodySubProfile).Profile.(*RotPoly).points)
	}

	return data
}

func (p Player) GetUpdates() Data {
	updates := NewData()
	updates.Merge(p.BaseObject.GetUpdates())
	updates.Merge(p.weapon.GetUpdates())
	return updates
}

func (p *Player) SetData(data Data) {
	if data.Size() == 0 {
		return
	}

	p.BaseObject.SetData(data)
	p.weapon.SetData(data)

	if data.Has(keysProp) {
		p.SetKeys(data.Get(keysProp).(map[KeyType]bool))
	}
	if data.Has(dirProp) {
		p.SetDir(data.Get(dirProp).(Vec2))
	}
	if data.Has(equipDirProp) {
		p.weapon.SetDir(data.Get(equipDirProp).(Vec2))
	}
}

func (p Player) Dead() bool {
	return p.Health.Dead() || p.Pos().Y < -5
}

func (p Player) UpdateScore(g *Grid) {
	sid := p.Health.GetLastDamageId(lastDamageTime)

	g.IncrementScore(p.GetSpacedId(), deathProp, 1)

	if sid.Invalid() {
		return
	}
	g.IncrementScore(sid, killProp, 1)
}

func (p *Player) Knockback(dir Vec2, now time.Time) {
	p.BaseObject.Knockback(dir, now)
	p.knockbackTimer.Start(now)
}

func (p *Player) Respawn() {
	p.Health.Respawn()

	p.SetHealth(100)
	p.RemoveAttribute(groundedAttribute)
	p.canDash = true

	rand.Seed(time.Now().Unix())
	p.SetPos(NewVec2(float64(15 + rand.Intn(15)), 20))
	p.SetVel(NewVec2(0, 0))
	p.SetAcc(NewVec2(0, 0))
}

func (p *Player) UpdateState(grid *Grid, now time.Time) bool {
	ts := p.PrepareUpdate(now)
	p.BaseObject.UpdateState(grid, now)

	if p.Dead() {
		p.UpdateScore(grid)
		p.Respawn()
	}

	pos := p.Pos()
	totalVel := p.TotalVel()
	vel := p.Vel()
	evel := p.ExtVel()
	acc := p.Acc()
	grounded := p.HasAttribute(groundedAttribute)

	// Gravity & air resistance
	acc.Y = gravityAcc
	if !grounded {
		if !p.jumpTimer.On(now) || totalVel.Y <= 0 {
			acc.Y += downAcc
		}
	}

	// Left & right
	if p.KeyDown(leftKey) != p.KeyDown(rightKey) {
		if p.KeyDown(leftKey) {
			acc.X = leftAcc
		} else {
			acc.X = rightAcc
		}
		if Sign(acc.X) == -Sign(totalVel.X) {
			acc.X *= turnMultiplier
		}
	} else {
		acc.X = 0
	}

	if p.HasAttribute(attachedAttribute) {
		acc.X = 0
		acc.Y = 0
	}

	p.SetAcc(acc)

	// Grounded actions
	if grounded {
		p.jumpGraceTimer.Start(now)
		p.canJump = true
		p.canDash = true

		// Friction
		if Sign(acc.X) != Sign(totalVel.X) {
			if p.knockbackTimer.On(now) {
				vel.X *= knockbackFriction
			} else {
				vel.X *= friction
			}
		}
	} else {
		if acc.X == 0 {
			vel.X *= airResistance
		}
	}

	// Jump & double jump
	if p.KeyDown(dashKey) {
		if p.canJump && p.jumpGraceTimer.On(now) {
			p.canJump = false
			acc.Y = 0
			vel.Y = Max(0, vel.Y) + jumpVel
			p.jumpTimer.Start(now)
		} else if p.KeyPressed(dashKey) && p.canDash {
			acc.Y = 0
			vel.Y = jumpVel
			p.canDash = false
			p.jumpTimer.Start(now)
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

	return true
}

func (p *Player) Postprocess(grid *Grid, now time.Time) {
	p.BaseObject.Postprocess(grid, now)

	p.weapon.SetPos(p.GetSubProfile(bodySubProfile).Pos())
	// TODO: add grace period for shooting?
	p.weapon.PressTrigger(primaryTrigger, p.KeyDown(mouseClick))
	p.weapon.PressTrigger(secondaryTrigger, p.KeyDown(altMouseClick))
	p.weapon.UpdateState(grid, now)

	p.Keys.SaveKeys()
}

func (p *Player) checkCollisions(grid *Grid) {
	colliders := grid.GetColliders(p)
	snapResults := p.Snap(colliders)
	if snapResults.posAdjustment.Y > 0 {
		p.AddAttribute(groundedAttribute)
	} else {
		p.RemoveAttribute(groundedAttribute)
	}

	colliders = grid.GetColliders(p)
	for len(colliders) > 0 {
		collider := PopObject(&colliders)
		switch object := collider.(type) {
		case *Pickup:
			if p.KeyDown(interactKey) {
				p.weapon.SetWeaponType(object.GetWeaponType())
			}
		}
	}
}

func (p *Player) UpdateKeys(keyMsg KeyMsg) {
	p.Keys.UpdateKeys(keyMsg)

	weaponDir := keyMsg.D
	p.weapon.SetDir(weaponDir)

	// Don't turn around right at dir.X = 0
	// Note: any changes here should also be done in the frontend
	dir := keyMsg.M
	dir.Sub(p.GetSubProfile(bodySubProfile).Pos(), 1.0)
	dir.Normalize()
	lastDir := p.Dir()
	if Abs(dir.X) < 0.3 && SignPos(dir.X) != SignPos(lastDir.X) {
		dir.X = FSignPos(lastDir.X) * Abs(dir.X)
	}
	if Abs(dir.X) < sqrtHalf {
		dir.X = sqrtHalf * FSignPos(dir.X)
		dir.Y = sqrtHalf * FSignPos(dir.Y)
	}
	p.SetDir(dir)
}