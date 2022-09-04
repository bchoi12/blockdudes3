package main

import (
	"math/rand"
	"time"
)

type Pellet struct {
	Projectile
}

func NewPellet(init Init) *Pellet {
	pellet := &Pellet {
		Projectile: NewProjectile(NewCircleObject(init)),
	}
	pellet.SetTTL(800 * time.Millisecond)
	pellet.SetDamage(10)
	return pellet
}

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

func (b *Bolt) AddAttribute(attribute AttributeType) {
	b.Projectile.AddAttribute(attribute)

	if attribute == chargedAttribute {
		b.SetTTL(1600 * time.Millisecond)
		b.SetDamage(80)
		b.SetExplosionOptions(ExplosionOptions {
			explode: true,
			size: NewVec2(5, 5),
			color: 0xffa424,
		})
	}
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
	rocket.SetExplosionOptions(ExplosionOptions {
		explode: true,
		size: NewVec2(4, 4),
		color: 0xbb4444,
	})
	rocket.SetDamage(50)
	return rocket
}

var starColors = [...]int {0xAD07DB, 0xc306d1, 0xed0505, 0xed8805, 0x020f9e, 0x5805ab}

type Star struct {
	Projectile
}

func NewStar(init Init) *Star {
	star := &Star {
		Projectile: NewProjectile(NewCircleObject(init)),
	}

	rand.Seed(time.Now().UnixMilli())
	color := starColors[rand.Intn(len(starColors))]

	star.SetTTL(1 * time.Second)
	star.SetExplosionOptions(ExplosionOptions {
		explode: true,
		size: NewVec2(1, 1),
		color: color,
	})
	star.SetDamage(25)
	star.SetSticky(true)
	star.SetIntAttribute(colorIntAttribute, color)
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
	hook.SetDamage(0)
	hook.SetSticky(true)
	return hook
}

func (h *GrapplingHook) UpdateState(grid *Grid, now time.Time) {
	h.Projectile.UpdateState(grid, now)

	if !h.HasAttribute(attachedAttribute) {
		return
	}

	player := grid.Get(h.GetOwner())
	if player == nil || player.HasAttribute(deadAttribute) {
		grid.Delete(h.GetSpacedId())
		return
	}

	if player != nil && !h.connected {
		h.connected = true
		h.RemoveTTL()
		connection := NewAttractConnection(h.attractFactor)
		connection.SetDistance(Min(1, h.Offset(player).Len() / 4))
		player.AddConnection(h.GetSpacedId(), connection)
		grid.Upsert(h)	
	}
}

func (h *GrapplingHook) OnDelete(grid *Grid) {
	if !h.connected {
		return
	}

	player := grid.Get(h.GetOwner())
	if player == nil {
		return
	}

	player.AddAttribute(doubleJumpAttribute)
	force := h.Offset(player)
	if force.Y < 0 {
		return
	}
	force.Normalize()
	force.Scale(5 * h.attractFactor)
	player.AddForce(force)
}
