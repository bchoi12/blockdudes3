package main

type Hit struct {
	spacedId SpacedId
	pos Vec2
}

func NewHit() *Hit {
	return &Hit {
		spacedId: Id(unknownSpace, 0),
		pos: NewVec2(0, 0),
	}
}

func (h Hit) GetSpacedId() SpacedId {
	return h.spacedId
}

func (h *Hit) SetSpacedId(sid SpacedId) {
	h.spacedId = sid
}

func (h Hit) Pos() Vec2 {
	return h.pos
}

func (h *Hit) SetPos(pos Vec2) {
	h.pos = pos
}

func (h Hit) GetData() Data {
	data := NewData()

	if h.spacedId.GetSpace() != unknownSpace {
		data.Set(spacedIdProp, h.spacedId)
	}
	data.Set(posProp, h.pos)
	return data
}