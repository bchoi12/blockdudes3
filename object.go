package main

import (
	"time"
)

/*
type ObjectData struct {
	S SpaceType
	Pos Vec2
	Dim Vec2
	Vel Vec2
}
*/

type ObjectUpdate func(thing Thing, grid *Grid, buffer *UpdateBuffer, ts float64)
type Object struct {
	Init
	Profile
	
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

func (o *Object) GetProfile() Profile {
	return o.Profile
}

func (o *Object) SetProfileOptions(options ProfileOptions) {
	o.Profile.SetOptions(options)
}

func (o *Object) TakeHit(shot *Shot, hit *Hit) {
	return
}

func (o *Object) UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool {
	if o.update == nil{
		return false
	}

	ts := o.PrepareUpdate(now)
	o.update(o, grid, buffer, ts)
	return true
}

func (o *Object) SetData(od ObjectData) {
	o.Profile.SetData(od)
}

func (o *Object) GetData() ObjectData {
	od := NewObjectData()
	od.Set(spaceProp, o.GetSpace())
	od.Set(posProp, o.Profile.Pos())
	od.Set(dimProp, o.Profile.Dim())
	od.Set(velProp, o.Profile.Vel())
	return od
}