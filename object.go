package main

import (
	"time"
)

type ObjectData struct {
	Pos Vec2
	Dim Vec2
	Vel Vec2

	C ObjectClassType
}

type ObjectUpdate func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64)
type Object struct {
	Init
	Profile
	
	health int
	update ObjectUpdate
	lastUpdateTime time.Time
}

func (o *Object) GetProfile() Profile {
	return o.Profile
}

func (o *Object) SetProfileOptions(options ProfileOptions) {
	o.Profile.SetOptions(options)
}

func (o *Object) GetSpacedId() SpacedId {
	return Id(objectIdSpace, o.Init.Id)
}

func (o *Object) TakeHit(shot *Shot, hit *Hit) {
	return
}

func (o *Object) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	if o.update == nil{
		return false
	}

	ts := GetTimestep(now, o.lastUpdateTime)
	if ts < 0 {
		return false
	}

	o.lastUpdateTime = now
	o.update(o, grid, buffer, ts)
	return true
}

func (o *Object) setObjectData(data ObjectData) {
	prof := o.Profile
	prof.SetPos(data.Pos)
	prof.SetVel(data.Vel)
}

func (o *Object) getObjectData() ObjectData {
	data := ObjectData {
		Pos: o.Profile.Pos(),
		Dim: o.Profile.Dim(),
		Vel: o.Profile.Vel(),
		C: o.GetClass(),
	}
	return data
}