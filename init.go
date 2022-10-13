package main

type IdType uint16
type SpaceType uint8
const (
	unknownSpace SpaceType = iota
	playerSpace
	mainBlockSpace
	roofBlockSpace
	balconyBlockSpace
	wallSpace
	lightSpace
	explosionSpace
	equipSpace
	weaponSpace
	bombSpace
	pelletSpace
	boltSpace
	rocketSpace
	starSpace
	grapplingHookSpace
	pickupSpace
	portalSpace
	goalSpace
	spawnSpace
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

func (sid SpacedId) Valid() bool {
	return !sid.Invalid()
}

func (sid SpacedId) Invalid() bool {
	return sid.GetSpace() == 0
}

type Init struct {
	SpacedId

	pos Vec2
	dim Vec2

	hasDir bool
	dir Vec2
}

type InitMethods interface {
	SpacedIdMethods
	InitPos() Vec2
	SetInitPos(pos Vec2)
	InitDim() Vec2
	InitDir() Vec2
	HasInitDir() bool
	SetInitDir(dir Vec2)
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

func NewInitC(sid SpacedId, pos Vec2, dim Vec2, center CardinalType) Init {
	switch center {
	case rightCardinal:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y), dim)
	case topRightCardinal:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y - dim.Y/2), dim)
	case topCardinal:
		return NewInit(sid, NewVec2(pos.X, pos.Y - dim.Y/2), dim)
	case topLeftCardinal:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y - dim.Y/2), dim)
	case leftCardinal:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y), dim)
	case bottomLeftCardinal:
		return NewInit(sid, NewVec2(pos.X + dim.X/2, pos.Y + dim.Y/2), dim)
	case bottomCardinal:
		return NewInit(sid, NewVec2(pos.X, pos.Y + dim.Y/2), dim)
	case bottomRightCardinal:
		return NewInit(sid, NewVec2(pos.X - dim.X/2, pos.Y + dim.Y/2), dim)
	}
	return NewInit(sid, pos, dim)
}

func (i Init) InitPos() Vec2 {
	return i.pos
} 

func (i *Init) SetInitPos(pos Vec2) {
	i.pos = pos
}

func (i Init) InitDim() Vec2 {
	return i.dim
}

func (i Init) InitDir() Vec2 {
	return i.dir
}

func (i Init) HasInitDir() bool {
	return i.hasDir
}

func (i *Init) SetInitDir(dir Vec2) {
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