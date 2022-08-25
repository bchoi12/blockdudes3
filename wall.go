package main

import (
	"time"
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
	profile := NewRec2(init)
	wall := &Wall {
		BaseObject: NewBaseObject(profile),
		speed: 0,
		waypointIndex: 0,
		waypoints: make([]Vec2, 0),
	}
	wall.AddAttribute(solidAttribute)
	return wall
}

func (w *Wall) SetSpeed(speed float64) {
	w.speed = speed
}

func (w *Wall) AddWaypoint(waypoint Vec2) {
	w.waypoints = append(w.waypoints, waypoint)
}

func (w *Wall) UpdateState(grid *Grid, now time.Time) {
	w.BaseObject.UpdateState(grid, now)
	if w.speed <= 0 || len(w.waypoints) == 0 {
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