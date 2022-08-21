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
	parts map[KeyType]WeaponPart
}

type WeaponPart interface {
	SetPressed(pressed bool)
	UpdateState(grid *Grid, now time.Time)
	State() PartStateType
	OnDelete(grid *Grid)
}

func NewWeapon(init Init) *Weapon {
	w := &Weapon {
		BaseObject: NewBaseObject(NewCircle(init)),
		Keys: NewKeys(),
		shotOffset: NewVec2(0, 0),
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

	w.parts = make(map[KeyType]WeaponPart)
	switch weaponType {
	case unknownWeapon:
	case uziWeapon:
		w.parts[mouseClick] = NewLauncher(w, pelletSpace)
		w.parts[altMouseClick] = NewLauncher(w, grapplingHookSpace)
		w.SetShotOffset(NewVec2(0.3, 0))
	case bazookaWeapon:
		w.parts[mouseClick] = NewLauncher(w, rocketSpace)
		w.parts[altMouseClick] = NewJetpack(w.GetOwner())
		w.SetShotOffset(NewVec2(0.3, 0))
	case sniperWeapon:
		w.parts[mouseClick] = NewLauncher(w, boltSpace)
		w.parts[altMouseClick] = NewWeaponCharger(w, 1500 * time.Millisecond)
		w.SetShotOffset(NewVec2(0.6, 0))
	case starWeapon:
		w.parts[mouseClick] = NewLauncher(w, starSpace)
		w.parts[altMouseClick] = NewBooster(w)
		w.SetShotOffset(NewVec2(0.1, 0))
	default:
		Debug("Unknown weapon type! %d", weaponType)
		return
	}

	w.SetByteAttribute(typeByteAttribute, uint8(weaponType))
}

func (w *Weapon) UpdateState(grid *Grid, now time.Time) {
	w.PrepareUpdate(now)
	w.BaseObject.UpdateState(grid, now)
	for _, part := range(w.parts) {
		part.UpdateState(grid, now)
	}
	grid.Upsert(w)
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