package main

import (
	"time"
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

	SetTrigger(triggerType TriggerType, trigger *Trigger)
	PressTrigger(trigger TriggerType)
	UpdateState(trigger TriggerType, now time.Time) WeaponStateType
	Shoot(now time.Time) []*Shot
}

type BaseWeapon struct {
	owner SpacedId
	pos, dir, offset Vec2

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

		triggers: make(map[TriggerType]*Trigger),
	}

	bw.triggers[primaryTrigger] = NewTrigger(burstShotType, 3, 100 * time.Millisecond, 300 * time.Millisecond)
	bw.triggers[secondaryTrigger] = NewTrigger(bombShotType, 1, 50 * time.Millisecond, 800 * time.Millisecond)
	return bw
}

func (bw BaseWeapon) GetOwner() SpacedId { return bw.owner }
func (bw BaseWeapon) Pos() Vec2 { return bw.pos } 
func (bw *BaseWeapon) SetPos(pos Vec2) { bw.pos = pos } 
func (bw BaseWeapon) Dir() Vec2 { return bw.dir } 
func (bw *BaseWeapon) SetDir(dir Vec2) { bw.dir = dir } 

func (bw *BaseWeapon) SetOffset(offset Vec2) { bw.offset = offset }

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

func (bw *BaseWeapon) Shoot(now time.Time) []*Shot {
	shots := make([]*Shot, 0)
	for triggerType, trigger := range(bw.triggers) {
		state := bw.UpdateState(triggerType, now)
		if state != shootingWeaponState {
			continue
		}

		dist := bw.dir
		dist.Scale(20)
		shot := NewShot(bw, NewLine(bw.pos, dist))

		shot.shotType = trigger.shotType
		shot.pushForce = 5.0
		shot.colliderOptions = ColliderOptions {
			self: bw.GetOwner(),
		}
		shots = append(shots, shot)
	}
	return shots
}