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
	Profile
	DataMethods

	GetId() IdType
	GetSpace() SpaceType
	GetSpacedId() SpacedId
	
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

	Preprocess(grid *Grid, now time.Time)
	UpdateState(grid *Grid, now time.Time)
	Postprocess(grid *Grid, now time.Time)
	OnDelete(grid *Grid)
}

type BaseObject struct {
	Profile
	InitProps
	Association
	Health
	Expiration
	Attribute
	Attachment

	lastUpdateTime time.Time
}

func NewBaseObject(profile Profile) BaseObject {
	object := BaseObject {
		Profile: profile,
		InitProps: NewInitProps(),
		Association: NewAssociation(),
		Health: NewHealth(),
		Expiration: NewExpiration(),
		Attribute: NewAttribute(),
		Attachment: NewAttachment(profile.GetSpacedId()),
		lastUpdateTime: time.Time{},
	}
	return object
}

func NewRec2Object(init Init) BaseObject {
	profile := NewRec2(init)
	return NewBaseObject(profile)
}

func NewCircleObject(init Init) BaseObject {
	profile := NewCircle(init)
	return NewBaseObject(profile)
}


func (o *BaseObject) PrepareUpdate(now time.Time) float64 {
	ts := GetTimestep(now, o.lastUpdateTime)
	if ts >= 0 {
		o.lastUpdateTime = now
	}

	return Max(0, Min(ts, 2 * float64(frameMillis)))
}

func (o BaseObject) GetProfile() Profile {
	return o.Profile
}

func (o BaseObject) GetAttachment() Attachment {
	return o.Attachment
}

func (o *BaseObject) Preprocess(grid *Grid, now time.Time) {
	o.Attachment.Preprocess(grid, now)
}

func (o *BaseObject) UpdateState(grid *Grid, now time.Time) {
}

func (o *BaseObject) Postprocess(grid *Grid, now time.Time) {
	o.Attachment.Postprocess(grid, now)
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
	data.Merge(o.Profile.GetInitData())
	data.Merge(o.Association.GetInitData())
	data.Merge(o.Attribute.GetInitData())
	data.Merge(o.InitProps.GetInitData())
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