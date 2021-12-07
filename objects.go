package main

import (
	"time"
)

func NewRec2Object(init Init) Object {
	return Object {
		Init: init,
		Profile: NewRec2(init.Pos, init.Dim),
	}
}
func NewCircleObject(init Init) Object {
	return Object {
		Init: init,
		Profile: NewCircle(init.Pos, init.Dim),
	}
}

func NewWall(init Init) *Object {
	object := NewRec2Object(init)
	return &object
}

type Bomb struct {
	Object
	attached SpacedId
	offset Vec2
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
	b.health -= int(1000 * ts)

	if isWasm {
		return true
	}

	if b.health <= 0 {
		pos := b.GetInit().Pos
		dim := b.GetInit().Dim
		dim.Scale(3.6)

		init := NewInit(grid.NextSpacedId(explosionSpace), pos, dim)
		explosion := NewExplosion(init)
		
		grid.Upsert(explosion)
		grid.Delete(b.GetSpacedId())
	}
	return true
}

func NewExplosion(init Init) *Object {
	object := NewCircleObject(init)
	object.health = 300
	object.update = updateExplosion
	return &object
}
func updateExplosion(thing Thing, grid *Grid, buffer *UpdateBuffer, ts float64) {
	if isWasm {
		return
	}

	explosion := thing.(*Object)
	explosion.health -= int(1000 * ts)
	if explosion.health <= 0 {
		grid.Delete(explosion.GetSpacedId())
	}
}