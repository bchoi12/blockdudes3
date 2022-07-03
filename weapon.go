package main

import (
	"time"
)

type WeaponType uint8
const (
	unknownWeapon WeaponType = iota
	uziWeapon
	bazookaWeapon
)

type ShotType uint8
const (
	unknownShotType ShotType = iota

	boltShotType
	rocketShotType
)

type WeaponStateType uint8
const (
	unknownWeaponState WeaponStateType = iota
	readyWeaponState
	rotatingAmmoWeaponState
	reloadingWeaponState
	shootingWeaponState
)

type TriggerType uint8
const (
	unknownTrigger TriggerType = iota
	primaryTrigger
	secondaryTrigger
)

type Weapon interface {
	GetOwner() SpacedId

	Pos() Vec2
	SetPos(pos Vec2)
	Dir() Vec2
	SetDir(dir Vec2)
	
	SetOffset(offset Vec2)
	GetShotOrigin() Vec2

	SetWeaponType(weaponType WeaponType)
	SetTrigger(triggerType TriggerType, trigger *Trigger)
	PressTrigger(trigger TriggerType)
	UpdateState(trigger TriggerType, now time.Time) WeaponStateType
	Shoot(grid *Grid, now time.Time)

	GetInitData() Data
	GetData() Data
	GetUpdates() Data
	SetData(data Data)
}

type BaseWeapon struct {
	owner SpacedId
	pos, dir, offset Vec2

	weaponType *State
	triggers map[TriggerType]*Trigger
}

type Trigger struct {
	pressed bool
	shotType ShotType

	maxAmmo int
	ammo int
	ammoReloadTime time.Duration

	reloadTime time.Duration
	lastShotTime time.Time
}

func NewTrigger(shotType ShotType, maxAmmo int, ammoReloadTime time.Duration, reloadTime time.Duration) *Trigger {
	return &Trigger {
		pressed: false,
		shotType: shotType,
		maxAmmo: maxAmmo,
		ammo: maxAmmo,
		ammoReloadTime: ammoReloadTime,
		reloadTime: reloadTime,
		lastShotTime: time.Time{},
	}
}

func (t *Trigger) Reload() {
	t.ammo = t.maxAmmo
}

func NewBaseWeapon(owner SpacedId) *BaseWeapon {
	bw := &BaseWeapon {
		owner: owner,
		pos: NewVec2(0, 0),
		dir: NewVec2(1, 0),
		offset: NewVec2(0, 0),

		weaponType: NewBlankState(unknownWeapon),

		triggers: make(map[TriggerType]*Trigger),
	}
	return bw
}

func (bw BaseWeapon) GetOwner() SpacedId { return bw.owner }
func (bw BaseWeapon) Pos() Vec2 { return bw.pos } 
func (bw *BaseWeapon) SetPos(pos Vec2) { bw.pos = pos } 
func (bw BaseWeapon) Dir() Vec2 { return bw.dir } 
func (bw *BaseWeapon) SetDir(dir Vec2) { bw.dir = dir } 

func (bw *BaseWeapon) SetOffset(offset Vec2) { bw.offset = offset }
func (bw BaseWeapon) GetShotOrigin() Vec2 {
	origin := bw.Pos()
	offset := bw.offset
	offset.Rotate(bw.Dir().Angle())
	origin.Add(offset, 1.0)
	return origin
}

func (bw *BaseWeapon) SetWeaponType(weaponType WeaponType) {
	if isWasm {
		return
	}

	if weaponType == uziWeapon {
		bw.triggers[primaryTrigger] = NewTrigger(boltShotType, 3, 100 * time.Millisecond, 300 * time.Millisecond)
		bw.SetOffset(NewVec2(0.3, 0))
	} else if weaponType == bazookaWeapon {
		bw.triggers[primaryTrigger] = NewTrigger(rocketShotType, 1, 50 * time.Millisecond, 1000 * time.Millisecond)
		bw.SetOffset(NewVec2(0.3, 0))
	} else {
		Debug("Unknown weapon type! %d", weaponType)
		return
	}

	bw.weaponType.Set(weaponType)
}

func (bw *BaseWeapon) SetTrigger(triggerType TriggerType, trigger *Trigger) {
	bw.triggers[triggerType] = trigger
}

func (bw *BaseWeapon) PressTrigger(triggerType TriggerType) {
	if trigger, ok := bw.triggers[triggerType]; ok {
		trigger.pressed = true
	}
}

func (bw *BaseWeapon) UpdateState(triggerType TriggerType, now time.Time) WeaponStateType {
	trigger, ok := bw.triggers[triggerType]
	if !ok {
		return unknownWeaponState
	}

	if trigger.pressed && trigger.ammo > 0 {
		if now.Sub(trigger.lastShotTime) <= trigger.ammoReloadTime {
			return reloadingWeaponState
		}

		trigger.ammo -= 1
		trigger.lastShotTime = now
		return shootingWeaponState
	}

	if trigger.ammo == 0 {
		if now.Sub(trigger.lastShotTime) > trigger.reloadTime {
			trigger.Reload()
		} else {
			trigger.pressed = false
			return reloadingWeaponState
		}
	}
	return readyWeaponState
}

func (bw *BaseWeapon) Shoot(grid *Grid, now time.Time) {
	if isWasm {
		return
	}

	for triggerType, trigger := range(bw.triggers) {
		state := bw.UpdateState(triggerType, now)
		if state != shootingWeaponState {
			continue
		}

		if trigger.shotType == rocketShotType {
			rocket := NewRocket(NewObjectInit(grid.NextSpacedId(rocketSpace), bw.GetShotOrigin(), NewVec2(0.5, 0.5)))
			rocket.SetOwner(bw.GetOwner())
			acc := bw.dir
			acc.Normalize()
			acc.Scale(24)

			vel := bw.dir
			vel.Normalize()
			ownerVel := grid.Get(bw.GetOwner()).TotalVel()
			vel.Scale(Max(1, vel.Dot(ownerVel)))
			rocket.SetVel(vel)
			rocket.SetAcc(acc)

			acc.Scale(2)
			rocket.SetJerk(acc)
			grid.Upsert(rocket)
		} else if trigger.shotType == boltShotType {
			bolt := NewBolt(NewObjectInit(grid.NextSpacedId(boltSpace), bw.GetShotOrigin(), NewVec2(0.35, 0.15)))
			bolt.SetOwner(bw.GetOwner())
			vel := bw.dir
			vel.Normalize()
			vel.Scale(25)
			bolt.SetVel(vel)

			grid.Upsert(bolt)
		}
	}
}

func (bw BaseWeapon) GetInitData() Data {
	data := NewData()
	if bw.weaponType.Has() {
		data.Set(equipTypeProp, bw.weaponType.Peek())
	}
	return data
}

func (bw BaseWeapon) GetData() Data {
	data := NewData()
	if weaponType, ok := bw.weaponType.Pop(); ok {
		data.Set(equipTypeProp, weaponType)
	}
	return data
}

func (bw BaseWeapon) GetUpdates() Data {
	updates := NewData()

	if weaponType, ok := bw.weaponType.GetOnce(); ok {
		updates.Set(equipTypeProp, weaponType)
	}

	return updates
}

func (bw *BaseWeapon) SetData(data Data) {
	if data.Size() == 0 {
		return
	}

	if data.Has(equipTypeProp) {
		bw.SetWeaponType(WeaponType(data.Get(equipTypeProp).(int)))
	}
}