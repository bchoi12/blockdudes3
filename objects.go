package main

import (
	"time"
)

func NewRec2Object(init Init) BaseObject {
	profile := NewRec2(init)
	return NewBaseObject(profile)
}

func NewCircleObject(init Init) BaseObject {
	profile := NewCircle(init)
	return NewBaseObject(profile)
}

type Bomb struct {
	BaseObject
}

func NewBomb(init Init) *Bomb {
	bomb := &Bomb {
		BaseObject: NewCircleObject(init),
	}
	bomb.SetTTL(1200 * time.Millisecond)
	return bomb
}

func (b *Bomb) UpdateState(grid *Grid, now time.Time) {
	if isWasm {
		return
	}

	b.PrepareUpdate(now)
	b.BaseObject.UpdateState(grid, now)

	if b.Expired() {
		pos := b.Pos()
		dim := b.Dim()
		dim.Scale(3.6)

		init := NewInit(grid.NextSpacedId(explosionSpace), pos, dim)
		explosion := NewExplosion(init)
		
		grid.Upsert(explosion)
		grid.Delete(b.GetSpacedId())
	}
}

type Pickup struct {
	BaseObject
}

func NewPickup(init Init) *Pickup {
	profile := NewRec2(init)
	pickup := &Pickup {
		BaseObject: NewBaseObject(profile),
	}
	return pickup
}

func (p *Pickup) SetWeaponType(weaponType WeaponType) {
	p.SetByteAttribute(typeByteAttribute, uint8(weaponType))
}

func (p Pickup) GetWeaponType() WeaponType {
	typeByte, ok := p.GetByteAttribute(typeByteAttribute)
	if !ok {
		return unknownWeapon
	}
	return WeaponType(typeByte)
}