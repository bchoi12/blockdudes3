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
	initPos Vec2
	initDim Vec2
}

type InitMethods interface {
	SpacedIdMethods
	InitPos() Vec2
	SetInitPos(initPos Vec2)
	InitDim() Vec2
	SetInitDim(initDim Vec2)
	GetInitData() Data
}

func NewInit(sid SpacedId, data Data) Init {
	return Init {
		SpacedId: sid,
		initPos: data.Get(posProp).(Vec2),
		initDim: data.Get(dimProp).(Vec2),
	}
}

func NewInitData(pos Vec2, dim Vec2) Data {
	data := NewData()
	data.Set(posProp, pos)
	data.Set(dimProp, dim)
	return data
}

func (i Init) InitPos() Vec2 {
	return i.initPos
} 

func (i *Init) SetInitPos(initPos Vec2) {
	i.initPos = initPos
}

func (i Init) InitDim() Vec2 {
	return i.initDim
}

func (i *Init) SetInitDim(initDim Vec2) {
	i.initDim = initDim
}

func (i Init) GetInitData() Data {
	data := NewData()
	data.Set(posProp, i.initPos)
	data.Set(dimProp, i.initDim)
	return data
}