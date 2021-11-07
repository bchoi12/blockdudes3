package main

import (
	"time"
)

type ObjectInitData struct {
	Init
}

func NewObjectInitData(init Init) ObjectInitData {
	return ObjectInitData {
		Init: init,
	}
}

type ObjectData struct {
	Pos Vec2
	Vel Vec2
}

func NewObject(initData ObjectInitData) *Object {
	return &Object {
		id : initData.Init.Id,
		Profile: NewRec2(initData.Init.Pos, initData.Init.Dim),
	}
}

type ObjectUpdate func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64)
type Object struct {
	id int
	Profile

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
	return Id(objectIdSpace, o.id)
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
	return ObjectData {
		Pos: o.Profile.Pos(),
		Vel: o.Profile.Vel(),
	}
}

func (o *Object) getObjectInitData() ObjectInitData {
	return ObjectInitData {
		Init {
			Id: o.id,
			Pos: o.Profile.Pos(),
			Dim: o.Profile.Dim(),
		},
	}
}