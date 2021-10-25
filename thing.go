package main

import (
	"time"
)

type Thing interface {
	New(id int, initData ThingInitData) *Thing
	Profile() Profile
	SetProfile(profile Profile)

	UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time)
}

type ThingInitData struct {

}