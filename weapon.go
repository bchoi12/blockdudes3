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

// TODO: this should just be an object
type Weapon interface {
	GetOwner() SpacedId

	Pos() Vec2
	SetPos(pos Vec2)
	Dir() Vec2
	SetDir(dir Vec2)
	
	SetOffset(offset Vec2)
	GetShotOrigin() Vec2

	GetWeaponType() WeaponType
	SetWeaponType(weaponType WeaponType)
	SetTrigger(triggerType TriggerType, trigger *Trigger)
	PressTrigger(trigger TriggerType, pressed bool)
	UpdateState(grid *Grid, now time.Time) bool

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
	uniqueShots map[SpaceType]IdType
}

func NewBaseWeapon(owner SpacedId) *BaseWeapon {
	bw := &BaseWeapon {
		owner: owner,
		pos: NewVec2(0, 0),
		dir: NewVec2(1, 0),
		offset: NewVec2(0, 0),

		weaponType: NewBlankState(unknownWeapon),
		triggers: make(map[TriggerType]*Trigger),
		uniqueShots: make(map[SpaceType]IdType),
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

func (bw BaseWeapon) GetWeaponType() WeaponType { return bw.weaponType.Peek().(WeaponType) }

func (bw *BaseWeapon) SetWeaponType(weaponType WeaponType) {
	if isWasm {
		return
	}

	if bw.weaponType.Peek().(WeaponType) == weaponType {
		return
	}

	switch weaponType {
	case uziWeapon:
		bw.triggers[primaryTrigger] = NewTrigger(bw, boltSpace)
		bw.triggers[secondaryTrigger] = NewTrigger(bw, grapplingHookSpace)
		bw.SetOffset(NewVec2(0.3, 0))
	case bazookaWeapon:
		bw.triggers[primaryTrigger] = NewTrigger(bw, rocketSpace)
		delete(bw.triggers, secondaryTrigger)
		bw.SetOffset(NewVec2(0.3, 0))
	case sniperWeapon:
		bw.triggers[primaryTrigger] = NewTrigger(bw, boltSpace)
		delete(bw.triggers, secondaryTrigger)
		bw.SetOffset(NewVec2(0.6, 0))
	case starWeapon:
		bw.triggers[primaryTrigger] = NewTrigger(bw, starSpace)
		delete(bw.triggers, secondaryTrigger)
		bw.SetOffset(NewVec2(0.1, 0))
	default:
		Debug("Unknown weapon type! %d", weaponType)
		return
	}

	bw.weaponType.Set(weaponType)
}

func (bw *BaseWeapon) SetTrigger(triggerType TriggerType, trigger *Trigger) {
	bw.triggers[triggerType] = trigger
}

func (bw *BaseWeapon) PressTrigger(triggerType TriggerType, pressed bool) {
	if trigger, ok := bw.triggers[triggerType]; ok {
		trigger.SetPressed(pressed)
	}
}

func (bw *BaseWeapon) UpdateState(grid *Grid, now time.Time) bool {
	updated := false
	for _, trigger := range(bw.triggers) {
		if trigger.UpdateState(grid, now) {
			updated = true
		}
	}
	return updated
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