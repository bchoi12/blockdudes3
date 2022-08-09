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

	if width > 0.5 {
		bolt.Ultra()
	}

	return bolt
}

func (b *Bolt) Ultra() {
	b.SetTTL(1600 * time.Millisecond)
	b.SetDamage(80)
	b.SetExplode(true)
	b.SetExplosionSize(NewVec2(5, 5))
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

type Star struct {
	Projectile
}

func NewStar(init Init) *Star {
	star := &Star {
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
	attractFactor float64
}

func NewGrapplingHook(init Init) *GrapplingHook {
	hook := &GrapplingHook {
		Projectile: NewProjectile(NewCircleObject(init)),
		connected: false,
		attractFactor: 4,
	}

	hook.SetTTL(800 * time.Millisecond)
	hook.SetExplode(false)
	hook.SetDamage(0)
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
	if player == nil && !isWasm {
		grid.Delete(h.GetSpacedId())
		return true
	}

	if player != nil && !h.connected {
		h.connected = true
		h.RemoveTTL()
		connection := NewAttractConnection(h.attractFactor)
		connection.SetDistance(Min(1, h.Offset(player).Len() / 4))
		player.AddConnection(h.GetSpacedId(), connection)
		return true
	}

	return updateResult
}

func (h *GrapplingHook) OnDelete(grid *Grid) {
	if !h.connected {
		return
	}

	player := grid.Get(h.GetOwner())
	if player == nil {
		return
	}

	force := h.Offset(player)
	if force.Y < 0 {
		return
	}
	force.Normalize()
	force.Scale(5 * h.attractFactor)
	player.AddForce(force)
}
