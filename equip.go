package main

import (
	"time"
)

type EquipType uint8 
const (
	unknownEquip EquipType = iota

	uziWeapon
	grapplingHookWeapon
	bazookaWeapon
	sniperWeapon
	starWeapon

	boosterEquip
	chargerEquip
	jetpackEquip
)

type PartStateType uint8
const (
	unknownPartState PartStateType = iota
	readyPartState
	activePartState
	rechargingPartState
)

type EquipPart interface {
	SetPressed(pressed bool)
	Update(grid *Grid, now time.Time)
	State() PartStateType
	OnDelete(grid *Grid)
}

func NewEquipPart(equip* Equip, equipType EquipType) EquipPart {
	switch equipType {
	case boosterEquip:
		return NewBooster(equip)
	case jetpackEquip:
		return NewJetpack(equip.GetOwner())
	}

	return nil
}

type Equip struct {
	BaseObject
	Keys
	parts map[KeyType]EquipPart
}

func NewEquip(init Init) *Equip {
	e := &Equip {
		BaseObject: NewSubObject(init),
		Keys: NewKeys(),
		parts: make(map[KeyType]EquipPart),
	}
	return e
}

func (e *Equip) SetType(equipType EquipType, equipSubtype EquipType) {
	if isWasm {
		return
	}

	if currentType, ok := e.GetByteAttribute(typeByteAttribute); ok && currentType == uint8(equipType) {
		return
	}

	e.parts = make(map[KeyType]EquipPart)
	e.SetByteAttribute(typeByteAttribute, uint8(equipType))
	e.SetByteAttribute(subtypeByteAttribute, uint8(equipSubtype))

	main := NewEquipPart(e, equipType)
	if main != nil {
		e.parts[mouseClick] = main
	}
	sub := NewEquipPart(e, equipSubtype)
	if sub != nil {
		e.parts[altMouseClick] = sub
	}

}

func (e *Equip) Update(grid *Grid, now time.Time) {
	e.PrepareUpdate(now)
	e.BaseObject.Update(grid, now)

	owner := grid.Get(e.GetOwner())
	if owner != nil && owner.HasAttribute(deadAttribute) {
		for _, part := range(e.parts) {
			part.SetPressed(false)
		}
	}

	for _, part := range(e.parts) {
		part.Update(grid, now)
	}

	for _, part := range(e.parts) {
		if part.State() != unknownPartState {
			e.SetByteAttribute(stateByteAttribute, uint8(part.State()))
			break
		}		
	}

	grid.Upsert(e)
}

func (e *Equip) OnDelete(grid *Grid) {
	for _, part := range(e.parts) {
		part.OnDelete(grid)
	}
}

func (e *Equip) UpdateKeys(keyMsg KeyMsg) {
	e.Keys.UpdateKeys(keyMsg)
	for key, part := range(e.parts) {
		part.SetPressed(e.KeyDown(key))
	}
	e.SetDir(keyMsg.D)
}