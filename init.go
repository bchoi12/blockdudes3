package main

type SpacedId struct {
	space SpaceType
	id IdType
}

type SpacedIdMethods interface {
	GetId() IdType
	GetSpace() SpaceType
	GetSpacedId() SpacedId
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

type InitMethods interface {
	SpacedIdMethods
	Pos() Vec2
	SetPos(pos Vec2)
	Dim() Vec2
	SetDim(dim Vec2)
	GetData() Data
	SetData(data Data)
}

func NewInit(sid SpacedId, data Data) Init {
	return Init {
		SpacedId: sid,
		pos: data.Get(posProp).(Vec2),
		dim: data.Get(dimProp).(Vec2),
	}
}

func NewInitData(pos Vec2, dim Vec2) Data {
	data := NewData()
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
	if data.Size() == 0 {
		return
	}

	if data.Has(posProp) {
		i.SetPos(data.Get(posProp).(Vec2))
	}
	if data.Has(dimProp) {
		i.SetDim(data.Get(dimProp).(Vec2))
	}
}