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

func (b *Bomb) UpdateState(grid *Grid, now time.Time) bool {
	b.PrepareUpdate(now)
	b.BaseObject.UpdateState(grid, now)

	if isWasm {
		return true
	}

	if b.Expired() {
		pos := b.Pos()
		dim := b.Dim()
		dim.Scale(3.6)

		init := NewObjectInit(grid.NextSpacedId(explosionSpace), pos, dim)
		explosion := NewExplosion(init)
		
		grid.Upsert(explosion)
		grid.Delete(b.GetSpacedId())
	}
	return true
}

type Pickup struct {
	BaseObject

	weaponType WeaponType
}

func NewPickup(init Init) *Pickup {
	profile := NewRec2(init)
	pickup := &Pickup {
		BaseObject: NewBaseObject(profile),
		weaponType: unknownWeapon,
	}

	return pickup
}

func (p *Pickup) SetWeaponType(weaponType WeaponType) {
	p.weaponType = weaponType
}

func (p Pickup) GetWeaponType() WeaponType {
	return p.weaponType
}

func (p Pickup) GetInitData() Data {
	data := p.BaseObject.GetInitData()
	data.Set(equipTypeProp, p.weaponType)
	return data
}