package main

import (
	"time"
)

type Projectile struct {
	BaseObject
	hits []*Hit

	damage int
	maxSpeed float64
	explode bool
	explosionSize Vec2
	sticky bool
	collider Object
}

func NewProjectile(object BaseObject) Projectile {
	p := Projectile {
		BaseObject: object,
		hits: make([]*Hit, 0),

		damage: 0,
		maxSpeed: 100,
		explode: false,
		explosionSize: NewVec2(4, 4),
		sticky: false,
		collider: nil,
	}

	overlapOptions := NewColliderOptions()
	overlapOptions.SetSpaces(true, playerSpace, wallSpace)
	overlapOptions.SetAttributes(true, solidAttribute)
	p.SetOverlapOptions(overlapOptions)

	return p
}

func (p *Projectile) SetOwner(owner SpacedId) {
	p.BaseObject.SetOwner(owner)
	overlapOptions := p.GetOverlapOptions()
	overlapOptions.SetIds(false, owner)
	p.SetOverlapOptions(overlapOptions)
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

func (p *Projectile) SetExplode(explode bool) {
	p.explode = explode
}

func (p *Projectile) SetExplosionSize(size Vec2) {
	p.explosionSize = size
}

func (p *Projectile) SetSticky(sticky bool) {
	p.sticky = sticky
}

func (p *Projectile) UpdateState(grid *Grid, now time.Time) bool {
	ts := p.PrepareUpdate(now)
	p.BaseObject.UpdateState(grid, now)

	p.hits = make([]*Hit, 0)

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

	pos := p.Pos()
	pos.Add(p.Vel(), ts)
	p.SetPos(pos)

	if isWasm {
		return true
	}

	if p.Expired() {
		p.SelfDestruct(grid)
		return true
	}

	if p.collider != nil && !p.sticky {
		p.SelfDestruct(grid)
		return true
	}

	colliders := grid.GetColliders(p)
	if len(colliders) > 0 {
		object := PopObject(&colliders)
		result := p.OverlapProfile(object.GetProfile())
		p.Stick(result)
		p.Collide(object, grid)
	}
	return true
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
		p.Hit(p.collider)
	}
	if p.explode {
		init := NewObjectInit(grid.NextSpacedId(explosionSpace), p.Pos(), p.explosionSize)	
		grid.Upsert(NewExplosion(init))
	}
	grid.Delete(p.GetSpacedId())	
}

func (p *Projectile) Hit(collider Object) {
	hit := NewHit()
	hit.SetTarget(collider.GetSpacedId())
	hit.SetPos(p.Pos())
	p.hits = append(p.hits, hit)

	switch object := collider.(type) {
	case *Player:
		object.TakeDamage(p.GetOwner(), p.GetDamage())
	}
}

func (p *Projectile) GetInitData() Data {
	data := NewData()
	data.Merge(p.BaseObject.GetInitData())
	data.Set(velProp, p.Vel())
	return data
}

func (p *Projectile) GetData() Data {
	data := NewData()
	data.Merge(p.BaseObject.GetData())
	return data
}

func (p *Projectile) GetUpdates() Data {
	updates := NewData()
	updates.Merge(p.BaseObject.GetUpdates())

	if len(p.hits) > 0 {
		hitPropMaps := make([]PropMap, 0)
		for _, hit := range(p.hits) {
			hitPropMaps = append(hitPropMaps, hit.GetData().Props())
		}
		updates.Set(hitsProp, hitPropMaps)
	}
	return updates
}