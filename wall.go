package main

import (
	"time"
)

type Wall struct {
	BaseObject

	xBounded bool
	xmin float64
	xmax float64

	yBounded bool
	ymin float64
	ymax float64
}

func NewWall(init Init) *Wall {
	profile := NewRec2(init)
	wall := &Wall {
		BaseObject: NewBaseObject(profile),
		xBounded: false,
		yBounded: false,
	}
	wall.AddAttribute(solidAttribute)
	return wall
}

func (w *Wall) SetXBounds(xmin float64, xmax float64) {
	w.xBounded = true
	w.xmin = xmin
	w.xmax = xmax
}

func (w *Wall) SetYBounds(ymin float64, ymax float64) {
	w.yBounded = true
	w.ymin = ymin
	w.ymax = ymax
}

func (w *Wall) UpdateState(grid *Grid, now time.Time) bool {
	if w.Vel().IsZero() {
		return false
	}

	ts := w.PrepareUpdate(now)
	pos := w.Pos()
	vel := w.Vel()
	if w.xBounded {
		if pos.X >= w.xmax && vel.X > 0 {
			vel.X = -Abs(vel.X)
		} else if pos.X <= w.xmin && vel.X < 0 {
			vel.X = Abs(vel.X)
		} 
	}
	if w.yBounded {
		if pos.Y >= w.ymax && vel.Y > 0 {
			vel.Y = -Abs(vel.Y)
		} else if pos.Y <= w.ymin && vel.Y < 0 {
			vel.Y = Abs(vel.Y)
		} 	
	}
	pos.Add(vel, ts)
	w.GetProfile().SetVel(vel)
	w.GetProfile().SetPos(pos)
	return true
}