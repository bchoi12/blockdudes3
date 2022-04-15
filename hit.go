package main

type Hit struct {
	target SpacedId
	pos Vec2
}

func NewHit() *Hit {
	return &Hit {
		target: Id(unknownSpace, 0),
		pos: NewVec2(0, 0),
	}
}

func (h Hit) GetTarget() SpacedId {
	return h.target
}

func (h *Hit) SetTarget(sid SpacedId) {
	h.target = sid
}

func (h Hit) Pos() Vec2 {
	return h.pos
}

func (h *Hit) SetPos(pos Vec2) {
	h.pos = pos
}

func (h Hit) GetData() Data {
	data := NewData()

	if h.target.GetSpace() != unknownSpace {
		data.Set(targetProp, h.target)
	}
	data.Set(posProp, h.pos)
	return data
}