package main

import (
	"time"
)

const (
	unknownWeapon int = iota
	spaceBurst
	spaceBlast
)

type Weapon2 interface {
	getColliderOptions() LineColliderOptions

	canShoot(now time.Time) bool
	bursting(now time.Time) bool
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

func NewWeapon(id int, class int) *Weapon {
	w := &Weapon {
		sid: Id(playerIdSpace, id),
		class: class,

		dist: 20.0,
		reloadTime: 1 * time.Second,
		recoilFactor: 0,
		pushFactor: 0,

		bursts: 0,
		maxBursts: 1,
		burstTime: 0,
		lastBurst: time.Time{},

		shooting: false,
		lastShot: time.Time{},
	}

	switch class {
	case spaceBurst:
		w.reloadTime = 400 * time.Millisecond
		w.recoilFactor = 4.0
		w.pushFactor = 5.0
		w.maxBursts = 3
		w.burstTime = 80 * time.Millisecond
	case spaceBlast:
		w.recoilFactor = 50.0
		w.pushFactor = 50.0
	}

	return w
}

func (w *Weapon) canShoot(now time.Time) bool {
	return !w.shooting && now.Sub(w.lastShot) >= w.reloadTime
}

func (w *Weapon) bursting(now time.Time) bool {
	return w.bursts > 0 && w.bursts < w.maxBursts && now.Sub(w.lastBurst) >= w.burstTime
}

func (w *Weapon) colliderOptions() LineColliderOptions {
	switch w.class {
	case spaceBurst:
		return LineColliderOptions {
			self: w.sid,
			ignore: make(map[int]bool, 0),
		}
	case spaceBlast:
		return LineColliderOptions {
			self: w.sid,
			ignore: map[int]bool { playerIdSpace: true },
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