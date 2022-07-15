package main

import (
	"time"
)

type Explosion struct {
	BaseObject
	hits map[SpacedId]bool
	activeFrames int
}

func NewExplosion(init Init) *Explosion {
	explosion := &Explosion {
		BaseObject: NewCircleObject(init),
		hits: make(map[SpacedId]bool, 0),
		activeFrames: 3,
	}
	overlapOptions := NewColliderOptions()
	overlapOptions.SetSpaces(true, playerSpace)
	explosion.SetOverlapOptions(overlapOptions)
	explosion.SetTTL(300 * time.Millisecond)
	return explosion
}

func (e *Explosion) Hit(object Object, now time.Time) {
	if isWasm {
		return
	}

	if e.activeFrames <= 0 {
		return
	}
	if e.hits[object.GetSpacedId()] {
		return
	}
	e.hits[object.GetSpacedId()] = true

	dir := object.Pos()
	dir.Sub(e.Pos(), 1.0)
	if (dir.IsZero()) {
		dir.X = 1
	}
	dir.Normalize()
	dir.Y += 0.1
	dir.Normalize()
	dir.Scale(15 * e.Dim().X)

	distSqr := e.DistSqr(object.GetProfile())
	distScalar := Min(1.0, 2.0 / distSqr)
	dir.Scale(distScalar)

	dir.Add(object.Vel(), 1.0)
	object.Knockback(dir, now)
}

func (e *Explosion) UpdateState(grid *Grid, now time.Time) bool {
	e.PrepareUpdate(now)

	if isWasm {
		return true
	}

	if e.Expired() {
		grid.Delete(e.GetSpacedId())
	}

	if e.activeFrames <= 0 {
		return true
	}
	
	e.activeFrames -= 1
	colliders := grid.GetColliders(e)
	for len(colliders) > 0 {
		object := PopObject(&colliders)
		e.Hit(object, now)
	}
	return true
}