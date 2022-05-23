package main

import (
	"time"
)

func NewRec2Object(init Init) Object {
	profile := NewRec2(init, NewData())
	return Object {
		Profile: profile,
	}
}

func NewCircleObject(init Init) Object {
	profile := NewCircle(init, NewData())
	return Object {
		Profile: profile,
	}
}

func NewWall(init Init) *Object {
	profile := NewRec2(init, NewData())
	profile.SetSolid(true)
	profile.SetStatic(true)
	return &Object {
		Profile: profile,
	}
}

type Platform struct {
	Object

	xBounded bool
	xmin float64
	xmax float64

	yBounded bool
	ymin float64
	ymax float64
}

func NewPlatform(init Init) *Platform {
	profile := NewRec2(init, NewData())
	profile.SetSolid(true)
	profile.SetStatic(true)
	return &Platform {
		Object: NewObject(profile, NewData()),
		xBounded: false,
		yBounded: false,
	}
}

func (p *Platform) SetXBounds(xmin float64, xmax float64) {
	p.xBounded = true
	p.xmin = xmin
	p.xmax = xmax
}

func (p *Platform) SetYBounds(ymin float64, ymax float64) {
	p.yBounded = true
	p.ymin = ymin
	p.ymax = ymax
}

func (p *Platform) UpdateState(grid *Grid, now time.Time) bool {
	if p.Vel().IsZero() {
		return false
	}

	ts := p.PrepareUpdate(now)
	pos := p.Pos()
	vel := p.Vel()
	if p.xBounded {
		if pos.X >= p.xmax && vel.X > 0 {
			vel.X = -Abs(vel.X)
		} else if pos.X <= p.xmin && vel.X < 0 {
			vel.X = Abs(vel.X)
		} 
	}
	if p.yBounded {
		if pos.Y >= p.ymax && vel.Y > 0 {
			vel.Y = -Abs(vel.Y)
		} else if pos.Y <= p.ymin && vel.Y < 0 {
			vel.Y = Abs(vel.Y)
		} 	
	}
	pos.Add(vel, ts)
	p.GetProfile().SetVel(vel)
	p.GetProfile().SetPos(pos)
	return true
}

type Bomb struct {
	Object
}

func NewBomb(init Init) *Bomb {
	bomb := &Bomb {
		Object: NewCircleObject(init),
	}
	bomb.SetTTL(1200 * time.Millisecond)
	return bomb
}

func (b *Bomb) UpdateState(grid *Grid, now time.Time) bool {
	b.PrepareUpdate(now)

	if isWasm {
		return true
	}

	if b.Expired() {
		pos := b.Pos()
		dim := b.Dim()
		dim.Scale(3.6)

		init := NewInit(grid.NextSpacedId(explosionSpace), NewInitData(pos, dim))
		explosion := NewExplosion(init)
		
		grid.Upsert(explosion)
		grid.Delete(b.GetSpacedId())
	}
	return true
}

// TODO: move to projectiles.go
type Bolt struct {
	Projectile
}

func NewBolt(init Init) *Bolt {
	points := make([]Vec2, 4)
	width := init.InitDim().X
	height := init.InitDim().Y
	points[0] = NewVec2(-width/2, -height/2)
	points[1] = NewVec2(-width/2, height/2)
	points[2] = NewVec2(width/2, height/2)
	points[3] = NewVec2(width/2, -height/2)
	profile := NewRotPoly(init, NewData(), points)
	bolt := &Bolt {
		Projectile: NewProjectile(NewObject(profile, NewData())),
	}
	bolt.SetTTL(500 * time.Millisecond)
	bolt.SetDamage(10)
	return bolt
}

type Rocket struct {
	Projectile
}

func NewRocket(init Init) *Rocket {
	rocket := &Rocket {
		Projectile: NewProjectile(NewCircleObject(init)),
	}
	rocket.SetMaxSpeed(80)
	rocket.SetTTL(1 * time.Second)
	rocket.SetExplode(true)
	rocket.SetDamage(50)
	return rocket
}

type Explosion struct {
	Object
	hits map[SpacedId]bool
	activeFrames int
}

func NewExplosion(init Init) *Explosion {
	explosion := &Explosion {
		Object: NewCircleObject(init),
		hits: make(map[SpacedId]bool, 0),
		activeFrames: 3,
	}

	explosion.SetTTL(300 * time.Millisecond)
	return explosion
}

func (e *Explosion) Hit(p *Player) {
	if e.activeFrames <= 0 {
		return
	}
	if e.hits[p.GetSpacedId()] {
		return
	}
	e.hits[p.GetSpacedId()] = true

	dir := p.GetProfile().Pos()
	dir.Sub(e.GetProfile().Pos(), 1.0)
	if (dir.IsZero()) {
		dir.X = 1
	}
	dir.Normalize()
	dir.Scale(60)
	dir.Add(p.GetProfile().Vel(), 1.0)
	p.GetProfile().SetVel(dir)
}

func (e *Explosion) UpdateState(grid *Grid, now time.Time) bool {
	e.PrepareUpdate(now)

	if isWasm {
		return true
	}

	e.activeFrames -= 1
	if e.Expired() {
		grid.Delete(e.GetSpacedId())
	}
	return true
}

func (e *Explosion) GetData() Data {
	data := NewData()
	data.Set(posProp, e.GetProfile().Pos())
	data.Set(dimProp, e.GetProfile().Dim())
	return data
}

type Pickup struct {
	Object

	weaponType WeaponType
}

func NewPickup(init Init) *Pickup {
	profile := NewRec2(init, NewData())
	pickup := &Pickup {
		Object: NewObject(profile, NewData()),
		weaponType: unknownWeapon,
	}

	return pickup
}

func (p *Pickup) SetWeaponType(weaponType WeaponType) {
	p.weaponType = weaponType
}

func (p Pickup) GetWeaponType() WeaponType {
	return p.weaponType
}