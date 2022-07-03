package main

type SpacedId struct {
	S SpaceType
	Id IdType
}

type SpacedIdMethods interface {
	GetId() IdType
	GetSpace() SpaceType
	GetSpacedId() SpacedId
}

func Id(space SpaceType, id IdType) SpacedId {
	return SpacedId {
		S: space,
		Id: id,
	}
}

func InvalidId() SpacedId {
	return SpacedId {
		S: 0,
		Id: 0,
	}
}

func (sid SpacedId) GetId() IdType {
	return sid.Id
}

func (sid SpacedId) GetSpace() SpaceType {
	return sid.S
}

func (sid SpacedId) GetSpacedId() SpacedId {
	return sid
}

func (sid SpacedId) Invalid() bool {
	return sid.GetSpace() == 0
}

type Init struct {
	SpacedId

	hasPos bool
	pos Vec2
	hasDim bool
	dim Vec2
}

type InitMethods interface {
	SpacedIdMethods
	Pos() Vec2
	SetPos(pos Vec2)
	Dim() Vec2
	SetDim(dim Vec2)
	GetInitData() Data
}

func NewInit(sid SpacedId) Init {
	return Init {
		SpacedId: sid,
		hasPos: false,
		hasDim: false,
	}
}

func NewObjectInit(sid SpacedId, pos Vec2, dim Vec2) Init {
	init := NewInit(sid)
	init.SetPos(pos)
	init.SetDim(dim)
	return init
}

func (i Init) Pos() Vec2 {
	return i.pos
} 

func (i *Init) SetPos(pos Vec2) {
	i.pos = pos
	i.hasPos = true
}

func (i Init) Dim() Vec2 {
	return i.dim
}

func (i *Init) SetDim(dim Vec2) {
	i.dim = dim
	i.hasDim = true
}

func (i Init) GetInitData() Data {
	data := NewData()
	if i.hasPos {
		data.Set(posProp, i.pos)
	}
	if i.hasDim {
		data.Set(dimProp, i.dim)
	}
	return data
}