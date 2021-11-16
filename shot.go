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

func (s *Shot) getShotData() ShotData {
	hits := make([]HitData, len(s.hits))
	for _, hit := range(s.hits) {
		hits = append(hits, hit.getHitData())
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
	IS IdSpaceType
	Id IdType
	H Vec2
}

func (h *Hit) getHitData() HitData {
	return HitData {
		IS: h.target.space,
		Id: h.target.id,
		H: h.hit,
	}
}