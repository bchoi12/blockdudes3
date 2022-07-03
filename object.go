package main

import (
	"time"
)

// TODO: move to different Attachment class
type Attachment struct {
	object Object
	offset Vec2
}

type Component interface {
	GetInitData() Data
	GetData() Data
	GetUpdates() Data
	SetData(data Data)
}

type Object interface {
	Profile

	GetProfile() Profile
	GetParent() Attachment
	SetParent(attach Attachment)
	GetChildren() []Attachment
	AddChild(attach Attachment)

	HasAttribute(attribute AttributeType) bool

	UpdateState(grid *Grid, now time.Time) bool
	Postprocess(grid *Grid, now time.Time)
}

type BaseObject struct {
	Profile
	Health
	Expiration
	Attribute

	parent Attachment
	children []Attachment

	lastUpdateTime time.Time
}

func NewBaseObject(profile Profile) BaseObject {
	object := BaseObject {
		Profile: profile,
		Health: NewHealth(),
		Expiration: NewExpiration(),
		Attribute: NewAttribute(),
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
	if len(o.GetChildren()) > 0 {
		o.UpdateChildren(grid, now)
	}
}

func (o *BaseObject) AddChild(attach Attachment) {
	o.children = append(o.children, attach)
	attach.object.SetParent(Attachment {o, attach.offset})
}
func (o *BaseObject) SetParent(attach Attachment) {
	o.parent = attach
}
func (o *BaseObject) GetParent() Attachment {
	return o.parent
}
func (o *BaseObject) GetChildren() []Attachment {
	return o.children
}

func (o *BaseObject) UpdateChildren(grid *Grid, now time.Time) {
	for _, attachment := range(o.children) {
		childPos := o.Pos()
		childPos.Add(attachment.offset, 1.0)
		attachment.object.SetPos(childPos)
		attachment.object.SetVel(o.TotalVel())
		attachment.object.SetAcc(o.Acc())

		grid.Upsert(attachment.object)
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