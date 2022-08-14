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

	parts map[KeyType]WeaponPart
}

type WeaponPart interface {
	SetPressed(pressed bool)
	UpdateState(grid *Grid, now time.Time)
	OnDelete(grid *Grid)
}

func NewWeapon(init Init) *Weapon {
	w := &Weapon {
		BaseObject: NewBaseObject(NewCircle(init)),
		Keys: NewKeys(),
		shotOffset: NewVec2(0, 0),

		jetpack: 80,
		dashTimer: NewTimer(1500 * time.Millisecond),
	
		parts: make(map[KeyType]WeaponPart),
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

	if currentType, ok := w.GetByteAttribute(typeByteAttribute); ok && currentType == uint8(weaponType) {
		return
	}

	switch weaponType {
	case unknownWeapon:
		delete(w.parts, mouseClick)
		delete(w.parts, altMouseClick)
	case uziWeapon:
		w.parts[mouseClick] = NewTrigger(w, pelletSpace)
		w.parts[altMouseClick] = NewTrigger(w, grapplingHookSpace)
		w.SetShotOffset(NewVec2(0.3, 0))
	case bazookaWeapon:
		w.parts[mouseClick] = NewTrigger(w, rocketSpace)
		delete(w.parts, altMouseClick)
		w.SetShotOffset(NewVec2(0.3, 0))
	case sniperWeapon:
		trigger := NewTrigger(w, boltSpace)
		trigger.SetMaxAmmo(1)
		trigger.SetProjectileSize(NewVec2(0.6, 0.2))
		trigger.SetProjectileVel(45)
		trigger.SetReloadTime(2 * time.Second)
		trigger.Reload()

		w.parts[mouseClick] = trigger
		delete(w.parts, altMouseClick)
		w.SetShotOffset(NewVec2(0.6, 0))
	case starWeapon:
		w.parts[mouseClick] = NewTrigger(w, starSpace)
		delete(w.parts, altMouseClick)
		w.SetShotOffset(NewVec2(0.1, 0))
	default:
		Debug("Unknown weapon type! %d", weaponType)
		return
	}

	w.SetByteAttribute(typeByteAttribute, uint8(weaponType))
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

	for _, part := range(w.parts) {
		part.UpdateState(grid, now)
	}
	return true
}

func (w *Weapon) OnDelete(grid *Grid) {
	for _, part := range(w.parts) {
		part.OnDelete(grid)
	}
}

func (w *Weapon) UpdateKeys(keyMsg KeyMsg) {
	w.Keys.UpdateKeys(keyMsg)

	for key, part := range(w.parts) {
		part.SetPressed(w.KeyDown(key))
	}
	w.SetDir(keyMsg.D)
}