package main

import (
	"time"
)

func NewRec2Object(init Init) Object {
	profile := NewRec2(init, NewData())
	profile.SetSolid(true)
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
	return &Platform {
		Object: NewRec2Object(init),
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

func (p *Platform) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
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
	bomb.health = 1200
	return bomb
}

func (b *Bomb) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	ts := b.PrepareUpdate(now)

	if isWasm {
		return true
	}

	b.health -= int(1000 * ts)
	if b.health <= 0 {
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

type Rocket struct {
	Object
	owner SpacedId
	maxSpeed float64
	jerk Vec2
}

func NewRocket(init Init) *Rocket {
	rocket := &Rocket {
		Object: NewRec2Object(init),
		jerk: NewVec2(0, 0),
	}
	rocket.SetSolid(false)

	return rocket
}

func (r *Rocket) SetOwner(owner SpacedId) {
	r.owner = owner
}

func (r *Rocket) SetMaxSpeed(maxSpeed float64) {
	r.maxSpeed = maxSpeed
}

func (r *Rocket) SetJerk(jerk Vec2) {
	r.jerk = jerk
}

func (r *Rocket) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	ts := r.PrepareUpdate(now)

	acc := r.Acc()
	acc.Add(r.jerk, ts)
	r.SetAcc(acc)

	vel := r.Vel()
	vel.Add(acc, ts)

	if vel.LenSquared() > r.maxSpeed * r.maxSpeed {
		vel.Normalize()
		vel.Scale(r.maxSpeed)
	}
	r.SetVel(vel)

	pos := r.Pos()
	pos.Add(r.TotalVel(), ts)
	r.SetPos(pos)

	if isWasm {
		return true
	}

	colliders := grid.GetColliders(r.GetProfile(), ColliderOptions {
		self: r.GetSpacedId(),
		solidOnly: true,
	})

	for len(colliders) > 0 {
		collider := PopThing(&colliders)

		results := r.Overlap(collider.GetProfile())
		if collider.GetSpacedId() == r.owner || !results.overlap {
			continue
		}

		init := NewInit(grid.NextSpacedId(explosionSpace), NewInitData(r.Pos(), NewVec2(3, 3)))	
		grid.Upsert(NewExplosion(init))
		grid.Delete(r.GetSpacedId())
		break
	}
	return true
}

type Explosion struct {
	Object
	hits map[SpacedId]bool
}

func NewExplosion(init Init) *Explosion {
	explosion := &Explosion {
		Object: NewCircleObject(init),
		hits: make(map[SpacedId]bool, 0),
	}
	explosion.health = 300
	return explosion
}

func (e *Explosion) Hit(p *Player) {
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

func (e *Explosion) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	ts := e.PrepareUpdate(now)

	if isWasm {
		return true
	}

	e.health -= int(1000 * ts)
	if e.health <= 0 {
		grid.Delete(e.GetSpacedId())
	}
	return true
}

func (e *Explosion) GetData() Data {
	od := NewObjectData()
	od.Set(posProp, e.GetProfile().Pos())
	od.Set(dimProp, e.GetProfile().Dim())
	return od
}