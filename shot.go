package main

type Shot struct {
	weapon *Weapon
	line Line

	recoil Vec2
	hits []*Hit
}

type ShotData struct {
	Id IdType
	O Vec2 // origin
	E Vec2 // end
	Hs []HitData
}

func (s *Shot) Resolve(grid *Grid) {
	collision, hit := grid.GetLineCollider(s.line, s.weapon.colliderOptions())
	if collision {
		s.hits = append(s.hits, hit)
		s.line.Scale(hit.t)

		if s.weapon.class == spaceBlast {
			bomb := NewBomb(NewInit(grid.NextSpacedId(bombSpace), NewInitData(NewVec2(hit.hit.X, hit.hit.Y), NewVec2(1, 1))))
			if target := grid.Get(hit.target); target != nil {
				target = target.(*Object)
				offset := hit.hit
				offset.Sub(grid.Get(hit.target).GetProfile().Pos(), 1.0)
				target.AddChild(Attachment {bomb, offset})
			}
			grid.Upsert(bomb)
		}
	}

	for _, hit := range(s.hits) {
		target := grid.Get(hit.target)
		s.Hit(target, grid)
	}
}

func (s *Shot) Hit(target Thing, grid *Grid) {
	switch thing := target.(type) {
	case *Player:
		thing.health -= 20
		vel := thing.GetProfile().Vel()
		force := s.line.R
		force.Normalize()
		vel.Add(force, s.weapon.pushFactor)
		thing.GetProfile().SetVel(vel)
	}
}

func (s *Shot) getShotData() ShotData {
	hits := make([]HitData, len(s.hits))
	for _, hit := range(s.hits) {
		hits = append(hits, hit.GetData())
	}

	return ShotData {
		Id: s.weapon.sid.id,
		O: s.line.O,
		E: s.line.Endpoint(),
		Hs: hits,
	}
}

type Hit struct {
	target SpacedId // target
	t float64 // distance (0-1)
	hit Vec2 // hit point
}

type HitData struct {
	S SpaceType
	Id IdType
	H Vec2
}

func (h *Hit) GetData() HitData {
	return HitData {
		S: h.target.space,
		Id: h.target.id,
		H: h.hit,
	}
}