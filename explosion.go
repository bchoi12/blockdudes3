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

	explosion.SetTTL(300 * time.Millisecond)
	return explosion
}

func (e *Explosion) Hit(p *Player) {
	if isWasm {
		return
	}

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
	dir.Scale(15 * e.Dim().X)

	distSqr := e.DistSqr(p.GetProfile())
	distScalar := Min(1.0, 2.0 / distSqr)
	dir.Scale(distScalar)

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