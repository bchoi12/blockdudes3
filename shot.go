package main

type Shot struct {
	weapon *Weapon
	line Line
	recoil Vec2

	hits []*Hit
}

func NewShot(weapon *Weapon, line Line) Shot {
	return Shot {
		weapon: weapon,
		line: line,

		hits: make([]*Hit, 0),
	}
}

func (s *Shot) Resolve(grid *Grid) {
	hit := grid.GetHits(s.line, s.weapon.colliderOptions())
	if hit == nil {
		return
	}

	s.hits = append(s.hits, hit)
	s.line.Scale(hit.GetT())
	if s.weapon.class == spaceBlast {
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
		vel.Add(force, s.weapon.pushFactor)
		thing.SetVel(vel)
	}
}

func (s *Shot) GetData() Data {
	data := NewData()

	// TODO: need weapon type

	data.Set(spacedIdProp, s.weapon.sid)
	data.Set(posProp, s.line.Origin())
	data.Set(endPosProp, s.line.Endpoint())

	hits := make([]PropMap, len(s.hits))
	for i, hit := range(s.hits) {
		hits[i] = hit.GetData().Props()
	}
	data.Set(hitsProp, hits)

	return data
}