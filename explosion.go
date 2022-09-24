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
	overlapOptions.SetSpaces(playerSpace)
	explosion.SetOverlapOptions(overlapOptions)
	explosion.SetTTL(300 * time.Millisecond)
	explosion.SetIntAttribute(colorIntAttribute, 0xffffff)
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

	force := object.Pos()
	force.Sub(e.Pos(), 1.0)
	if (force.IsZero()) {
		force.X = 1
	}
	force.Normalize()
	force.Y += 0.1
	force.Normalize()
	force.Scale(15 * e.Dim().X)

	distSqr := e.DistSqr(object.GetProfile())
	distScalar := Min(1.0, 2.0 / distSqr)
	force.Scale(distScalar)

	force.Add(object.Vel(), 1.0)
	object.AddForce(force)
}

func (e *Explosion) Update(grid *Grid, now time.Time) {
	e.PrepareUpdate(now)

	if isWasm {
		return
	}

	if e.Expired() {
		grid.Delete(e.GetSpacedId())
		return
	}

	if e.activeFrames <= 0 {
		return
	}
	
	e.activeFrames -= 1
	colliders := grid.GetColliders(e)
	for len(colliders) > 0 {
		object := PopObject(&colliders)
		e.Hit(object, now)
	}
	grid.Upsert(e)
}