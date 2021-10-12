package main

import (
	"time"
)

const (
	unknownWeapon int = iota
	spaceGun
)

type Weapon struct {
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
	hits map[int]Vec2
}

func (s *Shot) getShotData() ShotData {
	return ShotData {
		Id: s.id,
		O: s.line.O,
		E: s.line.Endpoint(),
		Hs: s.hits,
	}
}

type ShotData struct {
	Id int
	O Vec2
	E Vec2
	Hs map[int]Vec2
}

func NewWeapon() *Weapon {
	return &Weapon {
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

func (w *Weapon) shoot(id int, mouse Line, grid *Grid, now time.Time) *Shot {
	if w.reloading(now) {
		return nil
	}

	shot := Shot {
		id: id,
		line: mouse,
		phasePlayers: w.phasePlayers,
		hits: make(map[int]Vec2),
		recoil: NewVec2(0, 0),
	}

	shot.line.Normalize()
	shot.recoil = shot.line.R
	shot.recoil.Negate()

	shot.line.Scale(w.dist)
	shot.recoil.Scale(w.recoilFactor)

	w.lastShot = now
	hit, id, _, t := grid.getLineCollider(shot.line)
	if hit {
		shot.hits[id] = shot.line.Point(t)
		shot.line.Scale(t)
	}

	return &shot
}