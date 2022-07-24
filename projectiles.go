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

type PaperStar struct {
	Projectile
}

func NewPaperStar(init Init) *PaperStar {
	star := &PaperStar {
		Projectile: NewProjectile(NewCircleObject(init)),
	}
	star.SetTTL(1 * time.Second)
	star.SetExplode(true)
	star.SetDamage(25)
	star.SetSticky(true)
	star.SetExplosionSize(NewVec2(1, 1))
	return star
}

type GrapplingHook struct {
	Projectile
	connected bool
}

func NewGrapplingHook(init Init) *GrapplingHook {
	hook := &GrapplingHook {
		Projectile: NewProjectile(NewCircleObject(init)),
		connected: false,
	}

	hook.SetTTL(800 * time.Millisecond)
	hook.SetExplode(false)
	hook.SetDamage(10)
	hook.SetSticky(true)
	return hook
}

func (h *GrapplingHook) UpdateState(grid *Grid, now time.Time) bool {
	updateResult := h.Projectile.UpdateState(grid, now)

	if !h.HasAttribute(attachedAttribute) {
		return updateResult
	}

	if h.connected {
		return updateResult
	}

	player := grid.Get(h.GetOwner())
	if player != nil {
		h.connected = true
		h.RemoveTTL()
		connection := NewAttractConnection(20)
		connection.SetOffset(NewVec2(0, -player.Dim().Y / 2))
		player.AddConnection(h.GetSpacedId(), connection)
		return true
	}

	return updateResult
}
