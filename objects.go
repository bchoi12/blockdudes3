package main

import (
	"time"
)

func NewCircleObject(init Init) Object {
	return Object {
		Init: init,
		profile: NewCircle(init, NewProfileData(false)),
	}
}

func NewWall(init Init) *Object {
	return &Object {
		Init: init,
		profile: NewRec2(init, NewProfileData(true)),
	}
}

func NewPlatform(init Init) *Object {
	return &Object {
		Init: init,
		profile: NewRec2(init, NewProfileData(true)),
	}
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
		pos := b.GetProfile().Pos()
		dim := b.GetProfile().Dim()
		dim.Scale(3.6)

		init := NewInit(grid.NextSpacedId(explosionSpace), NewInitData(pos, dim))
		explosion := NewExplosion(init)
		
		grid.Upsert(explosion)
		grid.Delete(b.GetSpacedId())
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