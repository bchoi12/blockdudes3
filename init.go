package main

type IdType uint16
type SpaceType uint8
const (
	unknownSpace SpaceType = iota
	playerSpace
	blockSpace
	wallSpace
	lightSpace
	explosionSpace
	weaponSpace
	bombSpace
	pelletSpace
	boltSpace
	rocketSpace
	starSpace
	grapplingHookSpace
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

type OriginType uint8
const (
	unknownOrigin OriginType = iota
	defaultOrigin
	rightOrigin
	topRightOrigin
	topOrigin
	topLeftOrigin
	leftOrigin
	bottomLeftOrigin
	bottomOrigin
	bottomRightOrigin
)

type Init struct {
	SpacedId

	pos Vec2
	dim Vec2

	hasDir bool
	dir Vec2
}

type InitMethods interface {
	SpacedIdMethods
	Pos() Vec2
	Dim() Vec2
	Dir() Vec2
	GetInitData() Data
}

func NewInit(sid SpacedId, pos Vec2, dim Vec2) Init {
	return Init {
		SpacedId: sid,
		pos: pos,
		dim: dim,

		hasDir: false,
		dir: NewVec2(1, 0),
	}
}

func NewInitC(sid SpacedId, pos Vec2, dim Vec2, center OriginType) Init {
	switch center {
	case rightOrigin:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y), dim)
	case topRightOrigin:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y - dim.Y/2), dim)
	case topOrigin:
		return NewInit(sid, NewVec2(pos.X, pos.Y - dim.Y/2), dim)
	case topLeftOrigin:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y - dim.Y/2), dim)
	case leftOrigin:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y), dim)
	case bottomLeftOrigin:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y + dim.Y/2), dim)
	case bottomOrigin:
		return NewInit(sid, NewVec2(pos.X, pos.Y + dim.Y/2), dim)
	case bottomRightOrigin:
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

func (i Init) Dir() Vec2 {
	return i.dir
}

func (i *Init) SetDir(dir Vec2) {
	i.hasDir = true
	i.dir = dir
}

func (i Init) GetInitData() Data {
	data := NewData()
	data.Set(posProp, i.pos)
	data.Set(dimProp, i.dim)

	if i.hasDir {
		data.Set(dirProp, i.dir)
	}

	return data
}