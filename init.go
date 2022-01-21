package main

type SpacedId struct {
	space SpaceType
	id IdType
}

func Id(space SpaceType, id IdType) SpacedId {
	return SpacedId {
		space: space,
		id: id,
	}
}

func (sid SpacedId) GetId() IdType {
	return sid.id
}

func (sid SpacedId) GetSpace() SpaceType {
	return sid.space
}

func (sid SpacedId) GetSpacedId() SpacedId {
	return sid
}

type Init struct {
	SpacedId
	pos Vec2
	dim Vec2
}

func NewInit(sid SpacedId, data Data) Init {
	return Init {
		SpacedId: sid,
		pos: data.Get(posProp).(Vec2),
		dim: data.Get(dimProp).(Vec2),
	}
}

type InitData struct {
	*BaseData
}

func NewInitData(pos Vec2, dim Vec2) Data {
	data := InitData {
		BaseData: NewBaseData(),
	}
	data.Set(posProp, pos)
	data.Set(dimProp, dim)
	return data
}

func (i Init) Pos() Vec2 {
	return i.pos
} 

func (i *Init) SetPos(pos Vec2) {
	i.pos = pos
} 

func (i Init) Dim() Vec2 {
	return i.dim
} 

func (i *Init) SetDim(dim Vec2) {
	i.dim = dim
} 

func (i Init) GetData() Data {
	data := NewInitData(i.pos, i.dim)
	return data
}

func (i *Init) SetData(data Data) {
	i.SetPos(data.Get(posProp).(Vec2))
	i.SetDim(data.Get(dimProp).(Vec2))
}