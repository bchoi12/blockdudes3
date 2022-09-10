package main

import (
	"time"
)

const (
	jetpackMaxJuice int = 100
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

func (j *Jetpack) Update(grid *Grid, now time.Time) {
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
	jet := NewVec2(0, 1)
	scale := Clamp(1, -player.Vel().Y + 1, 1.6) 
	jet.Scale(scale)
	player.AddForce(jet)
	j.juice -= 1
}

func (j Jetpack) OnDelete(grid *Grid) {}