package main

type Hit struct {
	spacedId SpacedId
	pos Vec2
	dir Vec2

	t float64
}

func NewHit() *Hit {
	return &Hit {
		spacedId: Id(unknownSpace, 0),
		pos: NewVec2(0, 0),
		dir: NewVec2(1, 0),
		t: 0,
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

func (h Hit) Dir() Vec2 {
	return h.dir
}

func (h *Hit) SetDir(dir Vec2) {
	dir.Normalize()
	h.dir = dir
}

func (h Hit) GetT() float64 {
	return h.t
}

func (h *Hit) SetT(t float64) {
	h.t = t
}

func (h Hit) GetData() Data {
	data := NewData()

	data.Set(spacedIdProp, h.spacedId)
	data.Set(posProp, h.pos)

	return data
}