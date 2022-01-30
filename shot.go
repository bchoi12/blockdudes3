package main

type ShotType uint8
const (
	unknownShotType ShotType = iota

	burstShotType
	bombShotType
)

type Shot struct {
	weapon Weapon
	line Line

	shotType ShotType
	pushForce float64
	colliderOptions ColliderOptions

	hits []*Hit
}

func NewShot(weapon Weapon, line Line) *Shot {
	return &Shot {
		weapon: weapon,
		line: line,

		shotType: unknownShotType,
		pushForce: 0,
		colliderOptions: ColliderOptions{},

		hits: make([]*Hit, 0),
	}
}

func (s *Shot) Resolve(grid *Grid) {
	hit := grid.GetHits(s.line, s.colliderOptions)
	if hit == nil {
		return
	}

	s.hits = append(s.hits, hit)
	s.line.Scale(hit.GetT())
	if s.shotType == bombShotType {
		bomb := NewBomb(NewInit(grid.NextSpacedId(bombSpace), NewInitData(hit.Pos(), NewVec2(1, 1))))
		if target := grid.Get(hit.GetSpacedId()); target != nil {
			offset := hit.Pos()
			offset.Sub(grid.Get(hit.GetSpacedId()).Pos(), 1.0)
			target.AddChild(Attachment {bomb, offset})
		}
		grid.Upsert(bomb)
	}

	s.hit(hit, grid)
}

func (s *Shot) hit(hit *Hit, grid *Grid) {
	target := grid.Get(hit.GetSpacedId())
	switch thing := target.(type) {
	case *Player:
		thing.health -= 10
		vel := thing.Vel()
		force := hit.Dir()
		if !thing.Grounded() {
			vel.Add(force, s.pushForce)
			thing.SetVel(vel)
		}
	}
}

func (s *Shot) GetData() Data {
	data := NewData()

	data.Set(spacedIdProp, s.weapon.GetOwner())
	data.Set(shotTypeProp, s.shotType)

	if s.line.LenSquared() > 0 {
		data.Set(posProp, s.line.Origin())
		data.Set(endPosProp, s.line.Endpoint())
	}

	if len(s.hits) > 0 {
		hits := make([]PropMap, len(s.hits))
		for i, hit := range(s.hits) {
			hits[i] = hit.GetData().Props()
		}
		data.Set(hitsProp, hits)
	}

	return data
}