package main

import (
	"time"
)

type WeaponBlaster struct {
	BaseWeapon
}

func NewWeaponBlaster(owner SpacedId) *WeaponBlaster {
	b := &WeaponBlaster {
		BaseWeapon: NewBaseWeapon(owner),
	}
	b.triggers[primaryTrigger] = NewTrigger(burstShotType, 3, 100 * time.Millisecond, 300 * time.Millisecond)
	b.triggers[secondaryTrigger] = NewTrigger(bombShotType, 1, 50 * time.Millisecond, 800 * time.Millisecond)
	return b
}

type WeaponRocket struct {
	BaseWeapon
}

func NewWeaponRocket(owner SpacedId) *WeaponRocket {
	r := &WeaponRocket {
		BaseWeapon: NewBaseWeapon(owner),
	}

	r.triggers[primaryTrigger] = NewTrigger(rocketShotType, 1, 50 * time.Millisecond, 1000 * time.Millisecond)
	return r
}