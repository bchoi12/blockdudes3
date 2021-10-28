package main

import (
	"time"
)

const (
	unknownWeapon int = iota
	spaceGun
)

type Weapon struct {
	sid SpacedId
	t int

	dist float64
	reload time.Duration
	recoilFactor float64

	lastShot time.Time
}

type Shot struct {
	sid SpacedId
	line Line
	colliderOptions LineColliderOptions

	recoil Vec2
	hits []*Hit
}

type Hit struct {
	sid SpacedId // target
	t float64 // distance (0-1)
	hit Vec2 // hit point
}

type ShotData struct {
	Id int
	O Vec2 // origin
	E Vec2 // end
	Hs []HitData
}

type HitData struct {
	IS int
	Id int
	H Vec2
}

func (s *Shot) getShotData() ShotData {
	hits := make([]HitData, len(s.hits))
	for _, hit := range(s.hits) {
		hits = append(hits, hit.getHitData())
	}

	return ShotData {
		Id: s.sid.id,
		O: s.line.O,
		E: s.line.Endpoint(),
		Hs: hits,
	}
}

func (h *Hit) getHitData() HitData {
	return HitData {
		IS: h.sid.space,
		Id: h.sid.id,
		H: h.hit,
	}
}

func NewWeapon(id int) *Weapon {
	return &Weapon {
		sid: Id(playerIdSpace, id),
		t: spaceGun,

		dist: 30.0,
		reload: 80 * time.Millisecond,
		recoilFactor: 45.0,

		lastShot: time.Time{},
	}
}

func (w *Weapon) reloading(now time.Time) bool {
	return now.Sub(w.lastShot) < w.reload
}

func (w *Weapon) defaultColliderOptions() LineColliderOptions {
	return LineColliderOptions {
		self: w.sid,
		ignore: make(map[int]bool, 0),
	}
}

func (w *Weapon) shoot(mouse Line, grid *Grid, now time.Time) *Shot {
	if w.reloading(now) {
		return nil
	}

	shot := Shot {
		sid: w.sid,
		hits: make([]*Hit, 0),
		colliderOptions: w.defaultColliderOptions(),
	}
	shot.line = mouse
	shot.line.Scale(w.dist)

	shot.recoil = mouse.R
	shot.recoil.Negate()
	shot.recoil.Scale(w.recoilFactor)

	w.lastShot = now
	return &shot
}