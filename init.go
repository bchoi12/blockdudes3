package main

type IdType uint16
type SpaceType uint8
const (
	unknownSpace SpaceType = iota
	playerSpace
	blockSpace
	wallSpace
	weaponSpace
	bombSpace
	pelletSpace
	boltSpace
	rocketSpace
	starSpace
	grapplingHookSpace
	explosionSpace
	pickupSpace
)

type SpacedId struct {
	S SpaceType
	Id IdType
}

type SpacedIdMethods interface {
	SetId(id IdType)
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

func (sid *SpacedId) SetId(id IdType) {
	sid.Id = id
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

type CenterType uint8
const (
	unknownCenter CenterType = iota
	defaultCenter
	rightCenter
	topRightCenter
	topCenter
	topLeftCenter
	leftCenter
	bottomLeftCenter
	bottomCenter
	bottomRightCenter
)

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
	GetInitData() Data
}

func NewInit(sid SpacedId, pos Vec2, dim Vec2) Init {
	return Init {
		SpacedId: sid,
		pos: pos,
		dim: dim,
	}
}

func NewInitC(sid SpacedId, pos Vec2, dim Vec2, center CenterType) Init {
	switch center {
	case rightCenter:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y), dim)
	case topRightCenter:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y - dim.Y/2), dim)
	case topCenter:
		return NewInit(sid, NewVec2(pos.X, pos.Y - dim.Y/2), dim)
	case topLeftCenter:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y - dim.Y/2), dim)
	case leftCenter:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y), dim)
	case bottomLeftCenter:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y + dim.Y/2), dim)
	case bottomCenter:
		return NewInit(sid, NewVec2(pos.X, pos.Y + dim.Y/2), dim)
	case bottomRightCenter:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y + dim.Y/2), dim)
	}
	return NewInit(sid, pos, dim)
}

func (i Init) Pos() Vec2 {
	return i.pos
} 

func (i Init) Dim() Vec2 {
	return i.dim
}

func (i Init) GetInitData() Data {
	data := NewData()
	data.Set(posProp, i.pos)
	data.Set(dimProp, i.dim)
	return data
}