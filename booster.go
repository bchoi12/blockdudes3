package main

import (
	"time"
)

type Booster struct {
	weapon *Weapon
	state PartStateType
	pressed bool

	timer Timer
}

func NewBooster(weapon *Weapon) *Booster {
	return &Booster {
		weapon: weapon,
		state: unknownPartState,
		pressed: false,

		timer: NewTimer(1200 * time.Millisecond),
	}
}

func (b Booster) State() PartStateType {
	return b.state
}

func (b *Booster) SetPressed(pressed bool) {
	b.pressed = pressed
}

func (b *Booster) UpdateState(grid *Grid, now time.Time) {
	player := grid.Get(b.weapon.GetOwner())
	if player == nil {
		return
	}

	if b.timer.On() {
		b.state = rechargingPartState
		return
	}

	if !b.pressed {
		b.state = readyPartState
		return
	}

	dash := b.weapon.Dir()
	dash.Scale(4 * jumpVel)
	player.SetVel(dash)
	b.timer.Start()
}

func (b Booster) OnDelete(grid *Grid) {}