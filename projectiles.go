package main

import (
	"time"
)

type Bolt struct {
	Projectile
}

func NewBolt(init Init) *Bolt {
	points := make([]Vec2, 4)
	width := init.Dim().X
	height := init.Dim().Y
	points[0] = NewVec2(-width/2, -height/2)
	points[1] = NewVec2(-width/2, height/2)
	points[2] = NewVec2(width/2, height/2)
	points[3] = NewVec2(width/2, -height/2)
	profile := NewRotPoly(init, points)
	bolt := &Bolt {
		Projectile: NewProjectile(NewBaseObject(profile)),
	}
	bolt.SetTTL(800 * time.Millisecond)
	bolt.SetDamage(10)
	return bolt
}

type Rocket struct {
	Projectile
}

func NewRocket(init Init) *Rocket {
	rocket := &Rocket {
		Projectile: NewProjectile(NewCircleObject(init)),
	}
	rocket.SetMaxSpeed(80)
	rocket.SetTTL(1 * time.Second)
	rocket.SetExplode(true)
	rocket.SetDamage(50)
	return rocket
}