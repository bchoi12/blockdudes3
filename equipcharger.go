package main

import (
	"time"
)

type EquipCharger struct {
	equip Object
	pressed bool
	pressedTime time.Time
	chargeTime time.Duration
	state PartStateType
}

func NewEquipCharger(equip Object) *EquipCharger {
	return &EquipCharger {
		equip: equip,
		pressed: false,
		pressedTime: time.Time{},
		chargeTime: 1250 * time.Millisecond,
		state: unknownPartState,
	}
}

func (ec EquipCharger) State() PartStateType {
	return ec.state
}

func (ec *EquipCharger) SetPressed(pressed bool) {
	if !ec.pressed && pressed {
		ec.pressedTime = time.Now()
	}

	ec.pressed = pressed
}

func (ec *EquipCharger) Update(grid *Grid, now time.Time) {
	if ec.state == activePartState && !ec.equip.HasAttribute(chargedAttribute) {
		ec.state = readyPartState
		ec.pressedTime = now
	}

	if !ec.pressed {
		ec.state = readyPartState
		ec.equip.RemoveAttribute(chargingAttribute)
		ec.equip.RemoveAttribute(chargedAttribute)
		return
	}

	if now.Sub(ec.pressedTime) < ec.chargeTime {
		ec.state = rechargingPartState
		ec.equip.AddAttribute(chargingAttribute)
		return
	}

	if ec.state != activePartState {
		ec.state = activePartState
		ec.equip.RemoveAttribute(chargingAttribute)
		ec.equip.AddAttribute(chargedAttribute)
		return
	}
}

func (ec EquipCharger) OnDelete(grid *Grid) {
	ec.equip.RemoveAttribute(chargingAttribute)
	ec.equip.RemoveAttribute(chargedAttribute)
}