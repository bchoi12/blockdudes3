package main

import (
	"time"
)

type WallType uint8
const (
	unknownWall WallType = iota
	normalWall
	platformWall
	stairWall
	rampWall
)

type Wall struct {
	BaseObject

	speed float64
	waypointIndex int
	waypoints []Vec2 

	xBounded bool
	xmin float64
	xmax float64

	yBounded bool
	ymin float64
	ymax float64
}

func NewWall(init Init) *Wall {
	wall := &Wall {
		BaseObject: NewRec2Object(init),
		speed: 0,
		waypointIndex: 0,
		waypoints: make([]Vec2, 0),
	}
	wall.SetByteAttribute(typeByteAttribute, uint8(normalWall))
	return wall
}

func NewRamp(init Init, cardinal Cardinal) *Wall {
	dim := init.InitDim()
	points := make([]Vec2, 3)
	points[0] = NewVec2(-dim.X / 2, -dim.Y / 2)
	points[1] = NewVec2(dim.X / 2, -dim.Y / 2)
	if cardinal.Get(leftCardinal) {
		points[2] = NewVec2(dim.X / 2, dim.Y / 2)
	} else {
		points[2] = NewVec2(-dim.X / 2, dim.Y / 2)
	}
	rotPoly := NewRotPoly(init, points)
	wall := &Wall {
		BaseObject: NewBaseObject(init, rotPoly),
		speed: 0,
		waypointIndex: 0,
		waypoints: make([]Vec2, 0),
	}
	wall.SetByteAttribute(typeByteAttribute, uint8(rampWall))
	return wall
}

func (w *Wall) SetSpeed(speed float64) {
	w.speed = speed
}

func (w *Wall) AddWaypoint(waypoint Vec2) {
	w.waypoints = append(w.waypoints, waypoint)
}

func (w *Wall) Update(grid *Grid, now time.Time) {
	w.BaseObject.Update(grid, now)
	if w.speed <= 0 || len(w.waypoints) == 0 || isWasm {
		return
	}

	ts := w.PrepareUpdate(now)
	pos := w.Pos()
	nextPoint := w.waypoints[w.waypointIndex]

	offset := nextPoint
	offset.Sub(pos, 1.0)
	vel := offset
	vel.Normalize()
	if ts > 0 && w.speed * ts > offset.Len() {
		vel.Scale(offset.Len() / ts)
	} else {
		vel.Scale(w.speed)
	}
	w.SetVel(vel)

	pos.Add(vel, ts)
	w.SetPos(pos)

	if pos.DistanceSquared(nextPoint) <= 1e-4 {
		w.waypointIndex += 1

		if w.waypointIndex >= len(w.waypoints) {
			w.waypointIndex = 0
		}
	}
	grid.Upsert(w)
}