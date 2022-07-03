package main

import (
	"time"
)

type Component interface {
	GetInitData() Data
	GetData() Data
	GetUpdates() Data
	SetData(data Data)
}

type Object interface {
	Profile

	GetProfile() Profile
	HasAttribute(attribute AttributeType) bool
	UpdateState(grid *Grid, now time.Time) bool
	Postprocess(grid *Grid, now time.Time)
}

type BaseObject struct {
	Profile
	Health
	Expiration
	Attribute
	Attachment

	lastUpdateTime time.Time
}

func NewBaseObject(profile Profile) BaseObject {
	object := BaseObject {
		Profile: profile,
		Health: NewHealth(),
		Expiration: NewExpiration(),
		Attribute: NewAttribute(),
		Attachment: NewAttachment(),
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

func (o *BaseObject) UpdateState(grid *Grid, now time.Time) bool {
	return false
}

func (o *BaseObject) Postprocess(grid *Grid, now time.Time) {
	for sid, connection := range(o.GetChildren()) {
		object := grid.Get(sid)

		childPos := o.Pos()
		childPos.Add(connection.offset, 1.0)
		object.SetPos(childPos)
		object.SetVel(o.Vel())
		object.SetExtVel(o.ExtVel())
		object.SetAcc(o.Acc())
		grid.Upsert(object)
	}
}

func (o *BaseObject) SetData(data Data) {
	if data.Size() == 0 {
		return
	}
	o.Profile.SetData(data)
	o.Health.SetData(data)
	o.Attribute.SetData(data)
	o.lastUpdateTime = time.Now()
}

func (o BaseObject) GetInitData() Data {
	data := NewData()
	data.Merge(o.Profile.GetInitData())
	data.Merge(o.Health.GetInitData())
	data.Merge(o.Attribute.GetInitData())
	return data
}

func (o BaseObject) GetData() Data {
	data := NewData()
	data.Merge(o.Profile.GetData())
	data.Merge(o.Health.GetData())
	data.Merge(o.Attribute.GetData())
	return data
}

func (o BaseObject) GetUpdates() Data {
	updates := NewData()
	updates.Merge(o.Profile.GetUpdates())
	updates.Merge(o.Health.GetUpdates())
	updates.Merge(o.Attribute.GetUpdates())
	return updates
}