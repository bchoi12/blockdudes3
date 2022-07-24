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

	GetProfile() Profile
	GetOwner() SpacedId
	SetOwner(sid SpacedId)
	GetAttachment() Attachment
	AddAttribute(attribute AttributeType)
	RemoveAttribute(attribute AttributeType)
	HasAttribute(attribute AttributeType) bool
	AddConnection(parent SpacedId, connection Connection)

	UpdateState(grid *Grid, now time.Time) bool
	Postprocess(grid *Grid, now time.Time)
}

type BaseObject struct {
	Profile
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
		Association: NewAssociation(),
		Health: NewHealth(),
		Expiration: NewExpiration(),
		Attribute: NewAttribute(),
		Attachment: NewAttachment(profile.GetSpacedId()),
		lastUpdateTime: time.Time{},
	}
	return object
}

func (o *BaseObject) PrepareUpdate(now time.Time) float64 {
	ts := GetTimestep(now, o.lastUpdateTime)
	if ts >= 0 {
		o.lastUpdateTime = now
	}

	return Max(0, ts)
}

func (o BaseObject) GetProfile() Profile {
	return o.Profile
}

func (o BaseObject) GetAttachment() Attachment {
	return o.Attachment
}

func (o *BaseObject) UpdateState(grid *Grid, now time.Time) bool {
	updateResult := false

	if o.Attachment.UpdateState(grid, now) {
		updateResult = true
	}

	return updateResult
}

func (o *BaseObject) Postprocess(grid *Grid, now time.Time) {
	o.Attachment.Postprocess(grid, now)
}

func (o *BaseObject) SetData(data Data) {
	if data.Size() == 0 {
		return
	}
	o.Profile.SetData(data)
	o.Association.SetData(data)
	o.Health.SetData(data)
	o.Attribute.SetData(data)
	o.lastUpdateTime = time.Now()
}

func (o BaseObject) GetInitData() Data {
	data := NewData()
	data.Merge(o.Profile.GetInitData())
	data.Merge(o.Association.GetInitData())
	data.Merge(o.Health.GetInitData())
	data.Merge(o.Attribute.GetInitData())
	return data
}

func (o BaseObject) GetData() Data {
	data := NewData()
	data.Merge(o.Profile.GetData())
	data.Merge(o.Association.GetData())
	data.Merge(o.Health.GetData())
	data.Merge(o.Attribute.GetData())
	return data
}

func (o BaseObject) GetUpdates() Data {
	updates := NewData()
	updates.Merge(o.Profile.GetUpdates())
	updates.Merge(o.Association.GetUpdates())
	updates.Merge(o.Health.GetUpdates())
	updates.Merge(o.Attribute.GetUpdates())
	return updates
}