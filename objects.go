package main

import (
	"time"
)

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
	profile := NewRec2(init, NewData())
	profile.SetSolid(true)
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
	bomb.SetTTL(1200 * time.Millisecond)
	return bomb
}

func (b *Bomb) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
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

type Rocket struct {
	Object
	owner SpacedId
	maxSpeed float64
	jerk Vec2

	creationTime time.Time
	ttlDuration time.Duration
}

func NewRocket(init Init) *Rocket {
	rocket := &Rocket {
		Object: NewCircleObject(init),
		jerk: NewVec2(0, 0),
		maxSpeed: 80,
	}
	rocket.SetTTL(1 * time.Second)

	return rocket
}

func (r *Rocket) SetOwner(owner SpacedId) {
	r.owner = owner
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

	if r.Expired() {
		r.Explode(nil, grid)
		return true
	}

	colliders := grid.GetColliders(r.GetProfile(), ColliderOptions {
		self: r.GetSpacedId(),
		hitSpaces: map[SpaceType]bool { playerSpace: true },
		hitSolids: true,
	})

	for len(colliders) > 0 {
		collider := PopThing(&colliders)

		results := r.Overlap(collider.GetProfile())
		if collider.GetSpacedId() == r.owner || !results.overlap {
			continue
		}

		r.Explode(collider, grid)
		return true
	}
	return true
}

func (r *Rocket) Explode(collider Thing, grid *Grid) {
	if collider != nil {
		r.Hit(collider)
	}
	init := NewInit(grid.NextSpacedId(explosionSpace), NewInitData(r.Pos(), NewVec2(4, 4)))	
	grid.Upsert(NewExplosion(init))
	grid.Delete(r.GetSpacedId())
}

func (r *Rocket) Hit(collider Thing) {
	switch object := collider.(type) {
	case *Player:
		object.TakeDamage(r.owner, 50)
	}
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

func (e *Explosion) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
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