package main

import (
	"time"
)

type ExplosionOptions struct {
	explode bool
	size Vec2
	color int
}

type Projectile struct {
	BaseObject

	damage int
	maxSpeed float64
	sticky bool
	collider Object
	target SpacedId

	explosionOptions ExplosionOptions
}

func NewProjectile(object BaseObject) Projectile {
	p := Projectile {
		BaseObject: object,

		damage: 0,
		maxSpeed: 100,
		sticky: false,
		collider: nil,
		target: InvalidId(),

		explosionOptions: ExplosionOptions{
			explode: false,
		},
	}

	overlapOptions := NewColliderOptions()
	overlapOptions.SetSpaces(playerSpace, wallSpace)
	overlapOptions.SetAttributes(deadAttribute)
	p.SetOverlapOptions(overlapOptions)
	return p
}

func (p *Projectile) SetDamage(damage int) {
	p.damage = damage
}

func (p Projectile) GetDamage() int {
	return p.damage
}

func (p *Projectile) SetMaxSpeed(maxSpeed float64) {
	p.maxSpeed = maxSpeed
}

func (p *Projectile) SetExplosionOptions(options ExplosionOptions) {
	p.explosionOptions = options
}

func (p *Projectile) SetSticky(sticky bool) {
	p.sticky = sticky
}

func (p *Projectile) Charge() {}

func (p *Projectile) Update(grid *Grid, now time.Time) {
	ts := p.PrepareUpdate(now)
	p.BaseObject.Update(grid, now)

	acc := p.Acc()
	acc.Add(p.Jerk(), ts)
	p.SetAcc(acc)

	vel := p.Vel()
	vel.Add(acc, ts)

	if vel.LenSquared() > p.maxSpeed * p.maxSpeed {
		vel.Normalize()
		vel.Scale(p.maxSpeed)
	}
	p.SetVel(vel)

	lastPos := p.Pos()

	pos := p.Pos()
	pos.Add(p.Vel(), ts)
	p.SetPos(pos)

	if isWasm {
		grid.Upsert(p)
		return
	}

	if p.Expired() || (p.collider != nil && !p.sticky) {
		p.SelfDestruct(grid)
		return
	}


	var colliders ObjectHeap
	movement := p.Pos()
	movement.Sub(lastPos, 1.0)
	if movement.LenSquared() > 0 {
		line := NewLine(lastPos, movement)
		colliders = grid.GetCollidersCheckLine(p, line)
	} else {
		colliders = grid.GetColliders(p)
	}
	if len(colliders) > 0 {
		object := PopObject(&colliders)
		result := p.OverlapProfile(object.GetProfile())
		p.Stick(result)
		p.Collide(object, grid)
	}
	grid.Upsert(p)
}

func (p *Projectile) Collide(collider Object, grid *Grid) {
	if p.collider != nil {
		return
	}

	p.collider = collider
	p.Stop()
	connection := NewOffsetConnection(p.Offset(p.collider))

	if p.sticky {
		p.AddConnection(p.collider.GetSpacedId(), connection)
	}
}

func (p *Projectile) SelfDestruct(grid *Grid) {
	if p.collider != nil {
		p.Hit(grid, p.collider)
	}
	if p.explosionOptions.explode {
		init := NewInit(grid.NextSpacedId(explosionSpace), p.Pos(), p.explosionOptions.size)	
		explosion := NewExplosion(init)
		explosion.SetIntAttribute(colorIntAttribute, p.explosionOptions.color)
		grid.Upsert(explosion)
	}
	grid.Delete(p.GetSpacedId())	
}

func (p *Projectile) Hit(grid *Grid, collider Object) {
	if p.GetDamage() == 0 {
		return
	}

	p.target = p.collider.GetSpacedId()

	switch object := collider.(type) {
	case *Player:
		object.TakeDamage(p.GetOwner(), p.GetDamage())
	}
}

func (p *Projectile) GetInitData() Data {
	data := p.BaseObject.GetInitData()
	data.Set(velProp, p.Vel())
	return data
}

func (p Projectile) GetData() Data {
	data := p.BaseObject.GetData()

	if p.target.Valid() {
		data.Set(targetProp, p.target)
	}
	return data
}

func (p Projectile) GetUpdates() Data {
	updates := p.BaseObject.GetUpdates()

	if p.target.Valid() {
		updates.Set(targetProp, p.target)
	}

	return updates
}