package main

import (
	"time"
)

const (
	unknownWeapon int = iota
	spaceGun
)

type Shot struct {
	weapon *Weapon
	line Line

	recoil Vec2
	hits []*Hit
}

type ShotData struct {
	Id int
	O Vec2 // origin
	E Vec2 // end
	Hs []HitData
}

func (s *Shot) getShotData() ShotData {
	hits := make([]HitData, len(s.hits))
	for _, hit := range(s.hits) {
		hits = append(hits, hit.getHitData())
	}

	return ShotData {
		Id: s.weapon.sid.id,
		O: s.line.O,
		E: s.line.Endpoint(),
		Hs: hits,
	}
}

type Hit struct {
	target SpacedId // target
	t float64 // distance (0-1)
	hit Vec2 // hit point
}

type HitData struct {
	IS int
	Id int
	H Vec2
}

func (h *Hit) getHitData() HitData {
	return HitData {
		IS: h.target.space,
		Id: h.target.id,
		H: h.hit,
	}
}

type Weapon struct {
	sid SpacedId
	class int

	dist float64
	reloadTime time.Duration
	
	recoilFactor float64
	pushFactor float64

	bursts int
	maxBursts int
	burstTime time.Duration
	lastBurst time.Time

	shooting bool
	lastShot time.Time
}

func NewWeapon(id int) *Weapon {
	return &Weapon {
		sid: Id(playerIdSpace, id),
		class: spaceGun,

		dist: 30.0,
		reloadTime: 400 * time.Millisecond,

		recoilFactor: 2.0,
		pushFactor: 3.0,

		bursts: 0,
		maxBursts: 3,
		burstTime: 80 * time.Millisecond,
		lastBurst: time.Time{},

		shooting: false,
		lastShot: time.Time{},
	}
}

func (w *Weapon) canShoot(now time.Time) bool {
	return !w.shooting && now.Sub(w.lastShot) >= w.reloadTime
}

func (w *Weapon) bursting(now time.Time) bool {
	return w.bursts > 0 && w.bursts < w.maxBursts && now.Sub(w.lastBurst) >= w.burstTime
}

func (w *Weapon) colliderOptions() LineColliderOptions {
	switch w.class {
	case spaceGun:
		return LineColliderOptions {
			self: w.sid,
			ignore: make(map[int]bool, 0),
		}
	default:
		panic("missing weapon")
	}
}

func (w *Weapon) shoot(mouse Line, grid *Grid, now time.Time) *Shot {
	if !w.canShoot(now) && !w.bursting(now) {
		return nil
	}

	if !w.shooting {
		w.bursts = 0
		w.shooting = true
	}

	shot := &Shot {
		weapon: w,
		hits: make([]*Hit, 0),
	}
	shot.line = mouse
	shot.line.Scale(w.dist)

	shot.recoil = mouse.R
	shot.recoil.Scale(-w.recoilFactor)

	w.bursts += 1
	w.lastBurst = now
	if w.bursts >= w.maxBursts {
		w.shooting = false
		w.lastShot = now
	}
	return shot
}