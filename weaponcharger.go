package main

import (
	"time"
)

type WeaponCharger struct {
	weapon *Weapon
	pressed bool
	pressedTime time.Time
	chargeTime time.Duration
	state PartStateType
}

func NewWeaponCharger(weapon *Weapon, chargeTime time.Duration) *WeaponCharger {
	return &WeaponCharger {
		weapon: weapon,
		pressed: false,
		pressedTime: time.Time{},
		chargeTime: chargeTime,
		state: unknownPartState,
	}
}

func (wc WeaponCharger) State() PartStateType {
	return wc.state
}

func (wc *WeaponCharger) SetPressed(pressed bool) {
	if !wc.pressed && pressed {
		wc.pressedTime = time.Now()
	}

	wc.pressed = pressed
}

func (wc *WeaponCharger) Update(grid *Grid, now time.Time) {
	if wc.state == activePartState && !wc.weapon.HasAttribute(chargedAttribute) {
		wc.state = readyPartState
		wc.pressedTime = now
	}

	if !wc.pressed {
		wc.state = readyPartState
		wc.weapon.RemoveAttribute(chargingAttribute)
		wc.weapon.RemoveAttribute(chargedAttribute)
		return
	}

	if now.Sub(wc.pressedTime) < wc.chargeTime {
		wc.state = rechargingPartState
		wc.weapon.AddAttribute(chargingAttribute)
		return
	}

	if wc.state != activePartState {
		wc.state = activePartState
		wc.weapon.RemoveAttribute(chargingAttribute)
		wc.weapon.AddAttribute(chargedAttribute)
		return
	}
}

func (wc WeaponCharger) OnDelete(grid *Grid) {
	wc.weapon.RemoveAttribute(chargingAttribute)
	wc.weapon.RemoveAttribute(chargedAttribute)
}