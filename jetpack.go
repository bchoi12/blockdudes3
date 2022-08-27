package main

import (
	"time"
)

const (
	jetpackMaxJuice int = 80
)

type Jetpack struct {
	owner SpacedId
	state PartStateType
	pressed bool
	juice int
}

func NewJetpack(owner SpacedId) *Jetpack {
	return &Jetpack {
		owner: owner,
		state: unknownPartState,
		pressed: false,
		juice: jetpackMaxJuice,
	}
}

func (j Jetpack) State() PartStateType {
	return j.state
}

func (j *Jetpack) SetPressed(pressed bool) {
	j.pressed = pressed
}

func (j *Jetpack) UpdateState(grid *Grid, now time.Time) {
	player := grid.Get(j.owner)
	if player == nil {
		return
	}

	if player.HasAttribute(groundedAttribute) {
		j.juice = jetpackMaxJuice
	}

	if !j.pressed {
		j.state = readyPartState
		return
	}

	if j.juice <= 0 {
		j.state = rechargingPartState
		return
	}

	j.state = activePartState
	jet := NewVec2(0 /* FSign(player.Dir().X) * -player.Dir().Y */, 1)
	scale := Clamp(0.1, -0.5 * player.Vel().Y, 0.8) 
	jet.Scale(scale)
	player.AddForce(jet)
	j.juice -= 1
}

func (j Jetpack) OnDelete(grid *Grid) {}