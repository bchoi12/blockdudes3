package main

import (
	"time"
)

type DataMethods interface {
	GetInitData() Data
	GetData() Data
	GetUpdates() Data
	SetData(data Data)
}

type Object interface {
	InitMethods
	DataMethods
	Profile

	GetProfile() Profile
	HasInitProp(prop Prop) bool
	SetInitProp(prop Prop, value interface{})

	GetOwner() SpacedId
	SetOwner(sid SpacedId)

	AddConnection(parent SpacedId, connection Connection)

	SetTTL(duration time.Duration)
	RemoveTTL()

	AddAttribute(attribute AttributeType)
	RemoveAttribute(attribute AttributeType)
	HasAttribute(attribute AttributeType) bool
	SetByteAttribute(attribute ByteAttributeType, byte uint8)
	GetByteAttribute(attribute ByteAttributeType) (uint8, bool)
	SetIntAttribute(attribute IntAttributeType, int int)
	GetIntAttribute(attribute IntAttributeType) (int, bool)
	SetFloatAttribute(attribute FloatAttributeType, float float64)
	GetFloatAttribute(attribute FloatAttributeType) (float64, bool)

	PreUpdate(grid *Grid, now time.Time)
	Update(grid *Grid, now time.Time)
	PostUpdate(grid *Grid, now time.Time)
	OnDelete(grid *Grid)
}

type BaseObject struct {
	Init
	Profile
	InitProps
	Association
	Health
	Expiration
	Attribute
	Attachment

	lastUpdateTime time.Time
}

func NewBaseObject(init Init, profile Profile) BaseObject {
	object := BaseObject {
		Init: init,
		Profile: profile,
		InitProps: NewInitProps(),
		Association: NewAssociation(),
		Health: NewHealth(),
		Expiration: NewExpiration(),
		Attribute: NewAttribute(),
		Attachment: NewAttachment(init.GetSpacedId()),
		lastUpdateTime: time.Time{},
	}
	return object
}

func NewRec2Object(init Init) BaseObject {
	return NewBaseObject(init, NewRec2(init))
}

func NewCircleObject(init Init) BaseObject {
	return NewBaseObject(init, NewCircle(init))
}

func NewSubObject(init Init) BaseObject {
	return NewBaseObject(init, NewSubProfile(NewCircle(init)))
}

func (o BaseObject) GetProfile() Profile {
	return o.Profile
}

func (o *BaseObject) PrepareUpdate(now time.Time) float64 {
	ts := GetTimestep(now, o.lastUpdateTime)
	if ts >= 0 {
		o.lastUpdateTime = now
	}

	return Max(0, Min(ts, 2 * float64(frameMillis)))
}

func (o *BaseObject) PreUpdate(grid *Grid, now time.Time) {
	o.Attachment.PreUpdate(grid, now)
}

func (o *BaseObject) Update(grid *Grid, now time.Time) {
}

func (o *BaseObject) PostUpdate(grid *Grid, now time.Time) {
	o.Attachment.PostUpdate(grid, now)
}

func (o *BaseObject) OnDelete(grid *Grid) {
	return
}

func (o *BaseObject) SetData(data Data) {
	if data.Size() == 0 {
		return
	}
	o.Profile.SetData(data)
	o.Association.SetData(data)
	o.Attribute.SetData(data)
	o.lastUpdateTime = time.Now()
}

func (o BaseObject) GetInitData() Data {
	data := NewData()
	data.Merge(o.Init.GetInitData())
	data.Merge(o.InitProps.GetInitData())
	data.Merge(o.Profile.GetInitData())
	data.Merge(o.Association.GetInitData())
	data.Merge(o.Attribute.GetInitData())
	return data
}

func (o BaseObject) GetData() Data {
	data := NewData()
	data.Merge(o.Profile.GetData())
	data.Merge(o.Association.GetData())
	data.Merge(o.Attribute.GetData())
	return data
}

func (o BaseObject) GetUpdates() Data {
	updates := NewData()
	updates.Merge(o.Profile.GetUpdates())
	updates.Merge(o.Association.GetUpdates())
	updates.Merge(o.Attribute.GetUpdates())
	return updates
}