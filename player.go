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
	maxSpeed = 50.0
	knockbackForceSquared = 50

	jumpVel = 10.0

	friction = 0.4
	knockbackFriction = 1.0
	airResistance = 0.9

	jumpDuration time.Duration = 300 * time.Millisecond
	jumpGraceDuration time.Duration = 100 * time.Millisecond
	knockbackDuration time.Duration = 600 * time.Millisecond

	bodySubProfile ProfileKey = 1
	bodySubProfileOffsetY = 0.22
)

type Player struct {
	BaseObject
	Keys
	weapon *Weapon

	jumpTimer Timer
	jumpGraceTimer Timer
	knockbackTimer Timer
	deathTimer Timer
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
	subProfile.SetOffset(NewVec2(0, bodySubProfileOffsetY))
	profile.AddSubProfile(bodySubProfile, subProfile)

	overlapOptions := NewColliderOptions()
	overlapOptions.SetSpaces(wallSpace, pickupSpace)
	profile.SetOverlapOptions(overlapOptions)

	snapOptions := NewColliderOptions()
	snapOptions.SetSpaces(wallSpace)
	profile.SetSnapOptions(snapOptions)

	player := &Player {
		BaseObject: NewBaseObject(profile),
		Keys: NewKeys(),
		weapon: nil,

		jumpTimer: NewTimer(jumpDuration),
		jumpGraceTimer: NewTimer(jumpGraceDuration),
		knockbackTimer: NewTimer(knockbackDuration),
		deathTimer: NewTimer(2 * time.Second),
	}

	player.SetByteAttribute(typeByteAttribute, uint8(init.GetId() % 2))
	player.Respawn()
	return player
}

func (p Player) GetData() Data {
	data := p.BaseObject.GetData()
	data.Set(keysProp, p.GetKeys())
	return data
}

func (p *Player) SetData(data Data) {
	if data.Size() == 0 {
		return
	}
	p.BaseObject.SetData(data)
	if data.Has(keysProp) {
		p.SetKeys(data.Get(keysProp).(map[KeyType]bool))
	}
}

func (p Player) Dead() bool {
	return p.Health.Dead()
}

func (p Player) UpdateScore(g *Grid) {
	sid := p.Health.GetLastDamageId(lastDamageTime)
	g.IncrementScore(p.GetSpacedId(), deathProp, 1)

	if sid.Invalid() {
		return
	}

	g.IncrementScore(sid, killProp, 1)
}

func (p *Player) Respawn() {
	p.Health.Respawn()

	p.SetHealth(100)
	p.RemoveAttribute(groundedAttribute)
	p.AddAttribute(doubleJumpAttribute)

	rand.Seed(time.Now().Unix())
	// p.SetPos(NewVec2(float64(15 + rand.Intn(10)), 20))
	p.SetPos(NewVec2(29, 4.22))
	p.Stop()
}

func (p *Player) UpdateState(grid *Grid, now time.Time) {
	ts := p.PrepareUpdate(now)
	p.BaseObject.UpdateState(grid, now)

	if p.Expired() {
		grid.Delete(p.GetSpacedId())
		return
	}

	// Handle health stuff
	if p.Pos().Y < -7 {
		p.Die()
	}

	p.SetByteAttribute(healthByteAttribute, uint8(p.GetHealth()))
	if p.Dead() {
		if !p.HasAttribute(deadAttribute) {
			p.AddAttribute(deadAttribute)
			p.Keys.SetEnabled(false)
			p.deathTimer.Start()
			p.UpdateScore(grid)
		}

		if !p.deathTimer.On() {
			p.RemoveAttribute(deadAttribute)
			p.Keys.SetEnabled(true)
			p.Respawn()
		}
	}

	grounded := p.HasAttribute(groundedAttribute)
	acc := p.Acc()
	vel := p.Vel()
	pos := p.Pos()

	if grounded {
		p.jumpGraceTimer.Start()
		p.AddAttribute(doubleJumpAttribute)
	}


	// Gravity & air resistance
	acc.Y = gravityAcc
	if !grounded {
		if !p.jumpTimer.On() || vel.Y <= 0 {
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
		if Sign(acc.X) == -Sign(vel.X) {
			acc.X *= turnMultiplier
		}
	} else {
		acc.X = 0
	}

	p.SetAcc(acc)

	vel.Add(p.Acc(), ts)

	// Jump & double jump
	if p.KeyDown(jumpKey) {
		if p.jumpGraceTimer.On() {
			p.jumpGraceTimer.Stop()
			vel.Y = Max(0, vel.Y) + jumpVel
			p.jumpTimer.Start()
		} else if p.KeyPressed(jumpKey) && p.HasAttribute(doubleJumpAttribute) {
			vel.Y = jumpVel
			p.RemoveAttribute(doubleJumpAttribute)
			p.jumpTimer.Start()
		}
	}

	// Friction
	if grounded {
		if Sign(acc.X) != Sign(vel.X) {
			if p.knockbackTimer.On() {
				vel.X *= p.knockbackTimer.Lerp(knockbackFriction, friction)
			} else {
				vel.X *= friction
			}
		}
	} else {
		if acc.X == 0 {
			vel.X *= airResistance
		}
	}

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
	if force := p.ApplyForces(); force.LenSquared() > knockbackForceSquared {
		p.knockbackTimer.Start()
	}

	// Move
	pos.Add(p.Vel(), ts)
	pos.Add(p.ExtVel(), ts)
	p.SetPos(pos)
	p.checkCollisions(grid)
	grid.Upsert(p)
}

func (p *Player) Postprocess(grid *Grid, now time.Time) {
	p.BaseObject.Postprocess(grid, now)
	p.Keys.SaveKeys()
}

func (p *Player) OnDelete(grid *Grid) {
	if p.weapon != nil {
		grid.Delete(p.weapon.GetSpacedId())
	}
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
			if !isWasm && p.KeyDown(interactKey) {
				if p.weapon == nil {
					weapon := grid.New(NewInit(grid.NextSpacedId(weaponSpace), p.Pos(), p.Dim()))
					grid.Upsert(weapon)
					p.weapon = weapon.(*Weapon)
					p.weapon.AddConnection(p.GetSpacedId(), NewOffsetConnection(NewVec2(0, bodySubProfileOffsetY)))
					p.weapon.SetOwner(p.GetSpacedId())
				}

				p.weapon.SetWeaponType(object.GetWeaponType())
			}
		}
	}
}

func (p *Player) UpdateKeys(keyMsg KeyMsg) {
	p.Keys.UpdateKeys(keyMsg)
	if p.weapon != nil {
		p.weapon.UpdateKeys(keyMsg)
	}

	if p.HasAttribute(deadAttribute) {
		return
	}

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