package main

import (
	"time"
)

type Booster struct {
	weapon *Weapon
	state PartStateType
	pressed bool

	canBoost bool
	timer Timer
}

func NewBooster(weapon *Weapon) *Booster {
	return &Booster {
		weapon: weapon,
		state: unknownPartState,
		pressed: false,

		canBoost: true,
		timer: NewTimer(200 * time.Millisecond),
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

	grounded := player.HasAttribute(groundedAttribute)
	if grounded {
		b.canBoost = true
	}

	if !b.canBoost || b.timer.On() {
		b.state = rechargingPartState
		return
	}

	if !b.pressed {
		b.state = readyPartState
		return
	}

	if grounded {
		return
	}

	dash := b.weapon.Dir()
	dash.Scale(4 * jumpVel)
	player.Stop()
	player.AddForce(dash)

	b.canBoost = false
	b.timer.Start()
}

func (b Booster) OnDelete(grid *Grid) {}