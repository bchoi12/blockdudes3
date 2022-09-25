package main

import (
	"math/rand"
	"time"
)

const (
	shortRange time.Duration = 800 * time.Millisecond
	mediumRange time.Duration = 1000 * time.Millisecond
	longRange time.Duration = 1200 * time.Millisecond
)

type Pellet struct {
	Projectile
}

func NewPellet(init Init) *Pellet {
	pellet := &Pellet {
		Projectile: NewProjectile(NewCircleObject(init)),
	}
	pellet.SetTTL(shortRange)
	pellet.SetDamage(10)
	return pellet
}

type Bolt struct {
	Projectile
}

func NewBolt(init Init) *Bolt {
	points := make([]Vec2, 4)
	width := init.InitDim().X
	height := init.InitDim().Y
	points[0] = NewVec2(-width/2, -height/2)
	points[1] = NewVec2(-width/2, height/2)
	points[2] = NewVec2(width/2, height/2)
	points[3] = NewVec2(width/2, -height/2)
	profile := NewRotPoly(init, points)
	bolt := &Bolt {
		Projectile: NewProjectile(NewBaseObject(init, profile)),
	}
	bolt.SetTTL(shortRange)
	bolt.SetDamage(10)
	bolt.SetIntAttribute(colorIntAttribute, boltColor)
	return bolt
}

func (b *Bolt) AddAttribute(attribute AttributeType) {
	b.Projectile.AddAttribute(attribute)

	if attribute == chargedAttribute {
		b.SetIntAttribute(colorIntAttribute, chargedBoltColor)
		b.SetTTL(longRange)
		b.SetDamage(80)
		b.SetExplosionOptions(ExplosionOptions {
			explode: true,
			size: NewVec2(5, 5),
			color: chargedBoltColor,
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
	rocket.SetTTL(mediumRange)
	rocket.SetExplosionOptions(ExplosionOptions {
		explode: true,
		size: NewVec2(4, 4),
		color: rocketExplosionColor,
	})
	rocket.SetDamage(50)
	return rocket
}

var starColors = [...]int { starRed, starOrange, starBlue, starPurple, starDarkPurple }

type Star struct {
	Projectile
}

func NewStar(init Init) *Star {
	star := &Star {
		Projectile: NewProjectile(NewCircleObject(init)),
	}

	rand.Seed(UnixMilli())
	color := starColors[rand.Intn(len(starColors))]

	star.SetTTL(shortRange)
	star.SetExplosionOptions(ExplosionOptions {
		explode: true,
		size: NewVec2(1, 1),
		color: color,
	})
	star.SetDamage(20)
	star.SetSticky(true)
	star.SetIntAttribute(colorIntAttribute, color)
	star.SetIntAttribute(secondaryColorIntAttribute, starSecondary)
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

	hook.SetTTL(shortRange)
	hook.SetDamage(0)
	hook.SetSticky(true)
	return hook
}

func (h *GrapplingHook) Update(grid *Grid, now time.Time) {
	h.Projectile.Update(grid, now)

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

	player.AddAttribute(canDoubleJumpAttribute)
	force := h.Offset(player)
	if force.Y < 0 {
		return
	}
	force.Normalize()
	force.Scale(5 * h.attractFactor)
	player.AddForce(force)
}
