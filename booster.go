package main

import (
	"time"
)

type Booster struct {
	equip *Equip
	state PartStateType
	pressed bool

	doubleJumpReset bool
	canBoost bool
	timer Timer
}

func NewBooster(equip *Equip) *Booster {
	return &Booster {
		equip: equip,
		state: unknownPartState,
		pressed: false,

		doubleJumpReset: true,
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

func (b *Booster) Update(grid *Grid, now time.Time) {
	player := grid.Get(b.equip.GetOwner())
	if player == nil {
		b.state = unknownPartState
		return
	}

	enabled := player.HasAttribute(canJumpAttribute)
	if enabled {
		b.canBoost = true
		// b.doubleJumpReset = true
	}

	if !b.canBoost || b.timer.On() {
		if b.doubleJumpReset && !enabled && !player.HasAttribute(canDoubleJumpAttribute) {
			b.canBoost = true
			b.doubleJumpReset = false
		} else {
			b.state = rechargingPartState
			return
		}
	}

	if !b.pressed {
		b.state = readyPartState
		return
	}

	if enabled {
		b.state = readyPartState
		return
	}

	dash := b.equip.Dir()
	dash.Scale(3 * jumpVel)
	player.Stop()
	player.AddForce(dash)

	b.state = activePartState
	b.canBoost = false
	b.timer.Start()
}

func (b Booster) OnDelete(grid *Grid) {}