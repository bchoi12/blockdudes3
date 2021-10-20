package main

import (
	"time"
)

const (
	unknownWeapon int = iota
	spaceGun
)

type Weapon struct {
	id int
	t int

	phasePlayers bool
	dist float64
	reload time.Duration
	recoilFactor float64

	lastShot time.Time
}

type Shot struct {
	id int
	line Line
	phasePlayers bool

	recoil Vec2
	hits map[int]*Hit
}

type Hit struct {
	idSpace int
	id int
	t float64
	hit Vec2
}

type ShotData struct {
	Id int
	O Vec2
	E Vec2
	Hs map[int]HitData
}

type HitData struct {
	IS int
	Id int
	H Vec2
}

func (s *Shot) getShotData() ShotData {
	hits := make(map[int]HitData, len(s.hits))
	for id, hit := range(s.hits) {
		hits[id] = hit.getHitData()
	}

	return ShotData {
		Id: s.id,
		O: s.line.O,
		E: s.line.Endpoint(),
		Hs: hits,
	}
}

func (h *Hit) getHitData() HitData {
	return HitData {
		IS: h.idSpace,
		Id: h.id,
		H: h.hit,
	}
}

func NewWeapon(id int) *Weapon {
	return &Weapon {
		id: id,
		t: spaceGun,

		phasePlayers: false,
		dist: 30.0,
		reload: 80 * time.Millisecond,
		recoilFactor: 45.0,

		lastShot: time.Time{},
	}
}

func (w *Weapon) reloading(now time.Time) bool {
	return now.Sub(w.lastShot) < w.reload
}

func (w *Weapon) defaultLineColliderOptions() LineColliderOptions {
	return LineColliderOptions {
		selfId: w.id,
		hitPlayers: true,
		hitObjects: true,
	}
}

func (w *Weapon) shoot(mouse Line, grid *Grid, now time.Time) *Shot {
	if w.reloading(now) {
		return nil
	}

	shot := Shot {
		id: w.id,
		line: mouse,
		phasePlayers: w.phasePlayers,
		hits: make(map[int]*Hit),
		recoil: NewVec2(0, 0),
	}

	shot.line.Normalize()
	shot.recoil = shot.line.R
	shot.recoil.Negate()

	shot.line.Scale(w.dist)
	shot.recoil.Scale(w.recoilFactor)

	w.lastShot = now
	collision, hit := grid.getLineCollider(shot.line, w.defaultLineColliderOptions())
	if collision {
		shot.hits[w.id] = hit
		shot.line.Scale(hit.t)
	}

	return &shot
}