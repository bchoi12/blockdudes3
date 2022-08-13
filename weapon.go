package main

import (
	"time"
)

type WeaponType uint8
const (
	unknownWeapon WeaponType = iota
	uziWeapon
	bazookaWeapon
	sniperWeapon
	starWeapon
)

type Weapon struct {
	BaseObject
	Keys
	shotOffset Vec2

	jetpack int
	dashTimer Timer

	triggers map[TriggerType]*Trigger
	uniqueShots map[SpaceType]IdType
}

func NewWeapon(init Init) *Weapon {
	w := &Weapon {
		BaseObject: NewBaseObject(NewCircle(init)),
		Keys: NewKeys(),
		shotOffset: NewVec2(0, 0),

		jetpack: 80,
		dashTimer: NewTimer(1500 * time.Millisecond),
	
		triggers: make(map[TriggerType]*Trigger),
		uniqueShots: make(map[SpaceType]IdType),
	}
	return w
}

func (w *Weapon) SetShotOffset(shotOffset Vec2) { w.shotOffset = shotOffset }
func (w Weapon) GetShotOrigin() Vec2 {
	origin := w.Pos()
	shotOffset := w.shotOffset
	shotOffset.Rotate(w.Dir().Angle())
	origin.Add(shotOffset, 1.0)
	return origin
}

func (w Weapon) GetWeaponType() WeaponType {
	typeByte, ok := w.GetByteAttribute(typeByteAttribute)
	if !ok {
		return unknownWeapon
	}
	return WeaponType(typeByte)
}
func (w *Weapon) SetWeaponType(weaponType WeaponType) {
	if isWasm {
		return
	}

	if weaponType, ok := w.GetByteAttribute(typeByteAttribute); ok && weaponType == uint8(weaponType) {
		return
	}

	switch weaponType {
	case uziWeapon:
		w.triggers[primaryTrigger] = NewTrigger(w, boltSpace)
		w.triggers[secondaryTrigger] = NewTrigger(w, grapplingHookSpace)
		w.SetShotOffset(NewVec2(0.3, 0))
	case bazookaWeapon:
		w.triggers[primaryTrigger] = NewTrigger(w, rocketSpace)
		delete(w.triggers, secondaryTrigger)
		w.SetShotOffset(NewVec2(0.3, 0))
	case sniperWeapon:
		w.triggers[primaryTrigger] = NewTrigger(w, boltSpace)
		w.triggers[primaryTrigger].SetMaxAmmo(1)
		w.triggers[primaryTrigger].SetProjectileSize(NewVec2(0.6, 0.2))
		w.triggers[primaryTrigger].SetProjectileVel(45)
		w.triggers[primaryTrigger].SetReloadTime(2 * time.Second)
		w.triggers[primaryTrigger].Reload()

		delete(w.triggers, secondaryTrigger)
		w.SetShotOffset(NewVec2(0.6, 0))
	case starWeapon:
		w.triggers[primaryTrigger] = NewTrigger(w, starSpace)
		delete(w.triggers, secondaryTrigger)
		w.SetShotOffset(NewVec2(0.1, 0))
	default:
		Debug("Unknown weapon type! %d", weaponType)
		return
	}

	w.SetByteAttribute(typeByteAttribute, uint8(weaponType))
}

func (w *Weapon) SetTrigger(triggerType TriggerType, trigger *Trigger) {
	w.triggers[triggerType] = trigger
}

func (w *Weapon) PressTrigger(triggerType TriggerType, pressed bool) {
	if trigger, ok := w.triggers[triggerType]; ok {
		trigger.SetPressed(pressed)
	}
}

func (w *Weapon) OnGrounded() {
	w.jetpack = 80
}

func (w *Weapon) UpdateState(grid *Grid, now time.Time) bool {
	w.PrepareUpdate(now)
	w.BaseObject.UpdateState(grid, now)

	player := grid.Get(w.GetOwner())
	if player != nil {
		if w.KeyDown(altMouseClick) {
			weaponType := w.GetWeaponType()
			if weaponType == bazookaWeapon && w.jetpack > 0 {
				jet := NewVec2(FSign(player.Dir().X) * -player.Dir().Y, 1)
				scale := 0.3 + 0.6 * Clamp(0, 1 - player.Vel().Y, 1) 
				jet.Scale(scale)
				player.AddForce(jet)
				w.jetpack -= 1
			} else if weaponType == starWeapon && !w.dashTimer.On() {
				dash := w.Dir()
				dash.Scale(4 * jumpVel)
				player.SetVel(dash)
				w.dashTimer.Start()
			}
		}
	}

	for _, trigger := range(w.triggers) {
		trigger.UpdateState(grid, now)
	}
	return true
}

func (w *Weapon) OnDelete(grid *Grid) {
	for _, trigger := range(w.triggers) {
		trigger.DeleteTrackedProjectiles(grid)
	}
}

func (w *Weapon) UpdateKeys(keyMsg KeyMsg) {
	w.Keys.UpdateKeys(keyMsg)
	w.PressTrigger(primaryTrigger, w.KeyDown(mouseClick))
	w.PressTrigger(secondaryTrigger, w.KeyDown(altMouseClick))
	w.SetDir(keyMsg.D)
}