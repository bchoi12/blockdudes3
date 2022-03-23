package main

import (
	"time"
)

type Attachment struct {
	thing Thing
	offset Vec2
}

type Object struct {
	Profile
	Health
	Expiration

	parent Attachment
	children []Attachment

	lastUpdateTime time.Time
}

func NewObject(profile Profile, data Data) Object {
	object := Object {
		Profile: profile,
		Health: NewHealth(),
		Expiration: NewExpiration(),
		lastUpdateTime: time.Time{},
	}
	object.SetData(data)
	return object
}

func (o *Object) PrepareUpdate(now time.Time) float64 {
	ts := GetTimestep(now, o.lastUpdateTime)
	if ts >= 0 {
		o.lastUpdateTime = now
	}
	return Max(0, ts)
}

func (o *Object) EndUpdate() {
	o.UpdateChildren()
}

func (o Object) GetProfile() Profile {
	return o.Profile
}

func (o *Object) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	return false
}

func (o *Object) AddChild(attach Attachment) {
	o.children = append(o.children, attach)
	attach.thing.SetParent(Attachment {o, attach.offset})
}
func (o *Object) SetParent(attach Attachment) {
	o.parent = attach
}
func (o *Object) GetParent() Attachment {
	return o.parent
}
func (o *Object) GetChildren() []Attachment {
	return o.children
}

func (o *Object) UpdateChildren() {
	for _, attachment := range(o.children) {
		childPos := o.Pos()
		childPos.Add(attachment.offset, 1.0)
		attachment.thing.SetPos(childPos)
		attachment.thing.SetVel(o.TotalVel())
		attachment.thing.SetAcc(o.Acc())
	}
}

func (o *Object) SetData(data Data) {
	if data.Size() == 0 {
		return
	}
	o.Profile.SetData(data)
	o.Health.SetData(data)
	o.lastUpdateTime = time.Now()
}

func (o Object) GetData() Data {
	data := NewData()
	data.Merge(o.Profile.GetData())
	data.Merge(o.Health.GetData())
	return data
}