package main

import (
	"time"
)

type Attachment struct {
	thing Thing
	offset Vec2
}

type ObjectUpdate func(thing Thing, grid *Grid, buffer *UpdateBuffer, ts float64)
type Object struct {
	Init
	Profile

	parent Attachment
	children []Attachment
	
	health int
	lastUpdateTime time.Time

	// TODO: delete
	update ObjectUpdate
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

func (o *Object) GetProfile() Profile {
	return o.Profile
}

func (o *Object) SetProfileOptions(options ProfileOptions) {
	o.Profile.SetOptions(options)
}

func (o *Object) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	if o.update == nil{
		return false
	}

	ts := o.PrepareUpdate(now)
	o.update(o, grid, buffer, ts)
	o.EndUpdate()
	return true
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
		childPos := o.GetProfile().Pos()
		childPos.Add(attachment.offset, 1.0)
		attachment.thing.GetProfile().SetPos(childPos)
		attachment.thing.GetProfile().SetVel(o.GetProfile().TotalVel())
		attachment.thing.GetProfile().SetAcc(o.GetProfile().Acc())
	}
}

func (o *Object) SetData(od ObjectData) {
	o.Profile.SetData(od)
}

func (o *Object) GetData() ObjectData {
	od := NewObjectData()
	od.Set(posProp, o.Profile.Pos())
	od.Set(dimProp, o.Profile.Dim())
	od.Set(velProp, o.Profile.Vel())
	return od
}