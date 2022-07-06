package main

import (
	"time"
)

type Projectile struct {
	BaseObject
	owner *State
	hits []*Hit

	damage int
	maxSpeed float64
	explode bool
	explosionSize Vec2
	sticky bool
	collided bool
}

func NewProjectile(object BaseObject) Projectile {
	return Projectile {
		BaseObject: object,
		owner: NewBlankState(InvalidId()),
		hits: make([]*Hit, 0),

		damage: 0,
		maxSpeed: 100,
		explode: false,
		explosionSize: NewVec2(4, 4),
		sticky: false,
		collided: false,
	}
}

func (p Projectile) GetOwner() SpacedId {
	return p.owner.Peek().(SpacedId)
}

func (p *Projectile) SetOwner(owner SpacedId) {
	p.owner.Set(owner)
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
	pos.Add(p.TotalVel(), ts)
	p.SetPos(pos)

	if isWasm {
		return true
	}

	if p.Expired() {
		p.SelfDestruct(grid)
		return true
	}

	if p.collided {
		return true
	}

	colliders := grid.GetColliders(p.GetProfile(), ColliderOptions {
		self: p.GetSpacedId(),
		hitSpaces: map[SpaceType]bool { playerSpace: true },
		hitSolids: true,
	})

	for len(colliders) > 0 {
		collider := PopObject(&colliders)

		results := p.Overlap(collider.GetProfile())
		if collider.GetSpacedId() == p.GetOwner() || !results.overlap {
			continue
		}

		// TODO: move this to profile
		if Abs(vel.X) < zeroVelEpsilon {
			pos.Y -= FSign(vel.Y) * results.amount.Y
		} else if Abs(vel.Y) < zeroVelEpsilon {
			pos.X -= FSign(vel.X) * results.amount.X
		} else {
			collisionTime := results.amount
			collisionTime.X /= Abs(vel.X)
			collisionTime.Y /= Abs(vel.Y)

			var fx, fy float64
			if collisionTime.X < collisionTime.Y {
				fx = FSign(vel.X) * results.amount.X
				fy = FSign(vel.Y) * Abs(vel.Y / vel.X) * results.amount.X			
			} else {
				fx = FSign(vel.X) * Abs(vel.X / vel.Y) * results.amount.Y
				fy = FSign(vel.Y) * results.amount.Y			
			}

			pos.X -= fx
			pos.Y -= fy
		}
		p.SetPos(pos)

		p.Collide(collider, grid)
		return true
	}
	return true
}

func (p *Projectile) Collide(collider Object, grid *Grid) {
	if p.collided || collider == nil {
		return
	}

	p.Hit(collider)
	p.collided = true

	if p.sticky {
		p.Stop()
		collider.AddChild(p, NewConnection(collider.Offset(p)))
		return
	}

	p.SelfDestruct(grid)
}

func (p *Projectile) SelfDestruct(grid *Grid) {
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

	if p.owner.Has() {
		data.Set(ownerProp, p.owner.Peek())
	}

	data.Set(velProp, p.Vel())
	return data
}

func (p *Projectile) GetData() Data {
	data := NewData()
	data.Merge(p.BaseObject.GetData())

	if owner, ok := p.owner.Pop(); ok {
		data.Set(ownerProp, owner)
	}

	return data
}

func (p *Projectile) GetUpdates() Data {
	updates := NewData()
	updates.Merge(p.BaseObject.GetUpdates())

	if owner, ok := p.owner.GetOnce(); ok {
		updates.Set(ownerProp, owner)
	}

	if len(p.hits) > 0 {
		hitPropMaps := make([]PropMap, 0)
		for _, hit := range(p.hits) {
			hitPropMaps = append(hitPropMaps, hit.GetData().Props())
		}
		updates.Set(hitsProp, hitPropMaps)
	}
	return updates
}