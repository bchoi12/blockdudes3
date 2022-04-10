package main

import (
	"time"
)

type Projectile struct {
	Object
	owner SpacedId
	maxSpeed float64
	explode bool
}

func NewProjectile(object Object) Projectile {
	return Projectile {
		Object: object,
		owner: Id(unknownSpace, 0),
		maxSpeed: 0,
		explode: false,
	}
}

func (p Projectile) GetOwner() SpacedId {
	return p.owner
}

func (p *Projectile) SetOwner(owner SpacedId) {
	p.owner = owner
}

func (p *Projectile) SetMaxSpeed(maxSpeed float64) {
	p.maxSpeed = maxSpeed
}

func (p *Projectile) SetExplode(explode bool) {
	p.explode = explode
}

func (p *Projectile) UpdateState(grid *Grid, now time.Time) bool {
	ts := p.PrepareUpdate(now)

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
		p.Collide(nil, grid)
		return true
	}

	colliders := grid.GetColliders(p.GetProfile(), ColliderOptions {
		self: p.GetSpacedId(),
		hitSpaces: map[SpaceType]bool { playerSpace: true },
		hitSolids: true,
	})

	for len(colliders) > 0 {
		collider := PopThing(&colliders)

		results := p.Overlap(collider.GetProfile())
		if collider.GetSpacedId() == p.owner || !results.overlap {
			continue
		}

		p.Collide(collider, grid)
		return true
	}
	return true
}

func (p *Projectile) Collide(collider Thing, grid *Grid) {
	if collider != nil {
		p.Hit(collider)
	}

	if p.explode {
		init := NewInit(grid.NextSpacedId(explosionSpace), NewInitData(p.Pos(), NewVec2(4, 4)))	
		grid.Upsert(NewExplosion(init))
	}
	grid.Delete(p.GetSpacedId())
}

func (p *Projectile) Hit(collider Thing) {
	switch object := collider.(type) {
	case *Player:
		object.TakeDamage(p.owner, 50)
	}
}