package main

type BlockType uint8
const (
	unknownBlock BlockType = iota
	archBlock
)

type BlockSubtype uint8
const (
	unknownBlockSubtype BlockSubtype = iota
	baseBlockSubtype
	roofBlockSubtype
	balconyBlockSubtype
)

type BlockTemplate uint8
const (
	unknownBlockTemplate BlockTemplate = iota
	weaponsBlockTemplate
	middlePlatformBlockTemplate
	stairsBlockTemplate
)

var blockSizes = map[BlockType]map[BlockSubtype]Vec2 {
	archBlock: {
		baseBlockSubtype: NewVec2(12, 6),
		roofBlockSubtype: NewVec2(12, 2),
		balconyBlockSubtype: NewVec2(3, 2),
	},
}

var blockDimZs = map[BlockType]float64 {
	archBlock: 8.0,
}

type Block struct {
	BaseObject

	blockType BlockType
	blockSubtype BlockSubtype

	openings Cardinal
	thick float64
	sideOpening float64
	bottomOpening float64

	objects []Object
}

func NewBlock(init Init) *Block {
	return &Block {
		BaseObject: NewRec2Object(init),

		blockType: unknownBlock,
		blockSubtype: baseBlockSubtype,

		openings: NewCardinal(),
		thick: 0,
		sideOpening: 0,
		bottomOpening: 0,

		objects: make([]Object, 0),
	}
}

func (b Block) GetRelativePos(percent Vec2, buffer Vec2) Vec2 {
	pos := b.InitPos()
	dim := b.Dim()
	return NewVec2(pos.X - dim.X/2 + buffer.X/2 + percent.X * (dim.X - buffer.X),
				   pos.Y - dim.Y/2 + buffer.Y/2 + percent.Y * (dim.Y - buffer.Y))
}

func (b Block) GetObjects() []Object {
	return b.objects
}

func (b *Block) SetBlockType(blockType BlockType) {
	switch (blockType) {
	case archBlock:
		b.thick = 0.5
		b.sideOpening = 0.75
		b.bottomOpening = 0.5
		b.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
	default:
		return
	}

	b.blockType = blockType
	b.SetByteAttribute(typeByteAttribute, uint8(blockType))
}

func (b *Block) SetBlockSubtype(blockSubtype BlockSubtype) {
	b.blockSubtype = blockSubtype
	b.SetByteAttribute(subtypeByteAttribute, uint8(blockSubtype))
}

func (b *Block) AddOpenings(cardinals ...CardinalType) {
	for _, cardinal := range(cardinals) {
		b.openings.Add(cardinal)
	}
	b.SetByteAttribute(openingByteAttribute, b.openings.ToByte())
}

func (b *Block) SetOpenings(cardinal Cardinal) {
	b.openings = cardinal
	b.SetByteAttribute(openingByteAttribute, b.openings.ToByte())
}

func (b *Block) LoadTemplate(template BlockTemplate) {
	pos := b.InitPos()
	x := pos.X
	y := pos.Y
	dim := b.Dim()
	width := dim.X
	
	baseDim := blockSizes[b.blockType][baseBlockSubtype]
	baseHeight := baseDim.Y

	switch (template) {
	case weaponsBlockTemplate:
		uzi := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 3, y + b.thick), NewVec2(1.2, 1.2), bottomOrigin))
		uzi.SetByteAttribute(typeByteAttribute, uint8(uziWeapon))
		b.objects = append(b.objects, uzi)

		star := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 9, y + b.thick), NewVec2(1.2, 1.2), bottomOrigin))
		star.SetByteAttribute(typeByteAttribute, uint8(starWeapon))
		b.objects = append(b.objects, star)

		bazooka := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 9, y + b.thick), NewVec2(1.2, 1.2), bottomOrigin))
		bazooka.SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))
		b.objects = append(b.objects, bazooka)

		sniper := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 3, y + b.thick), NewVec2(1.2, 1.2), bottomOrigin))
		sniper.SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))
		b.objects = append(b.objects, sniper)

	case middlePlatformBlockTemplate:
		platform := NewWall(NewInit(Id(wallSpace, 0), NewVec2(x, y + b.thick + 2), NewVec2(width / 3, 0.2)))
		platform.SetByteAttribute(typeByteAttribute, uint8(platformWall))
		platform.AddAttribute(visibleAttribute)
		platform.SetFloatAttribute(dimZFloatAttribute, 4.0)
		if color, ok := b.GetIntAttribute(secondaryColorIntAttribute); ok {
			platform.SetIntAttribute(colorIntAttribute, color)
		}
		b.objects = append(b.objects, platform)

	case stairsBlockTemplate:
		stairWidth := 0.75
		stairHeight := 0.75
		numStairs := baseHeight / stairHeight
		for i := 0.0; i < numStairs; i += 1 {
			stair := NewWall(NewInitC(Id(wallSpace, 0),
				NewVec2(x + width / 2 - i * stairWidth, y + b.thick),
				NewVec2(stairWidth, baseHeight - i * stairHeight), bottomRightOrigin))
			stair.SetByteAttribute(typeByteAttribute, uint8(stairWall))
			stair.AddAttribute(visibleAttribute)
			stair.SetFloatAttribute(dimZFloatAttribute, 3.0)

			if color, ok := b.GetIntAttribute(secondaryColorIntAttribute); ok {
				stair.SetIntAttribute(colorIntAttribute, color)
			}

			b.objects = append(b.objects, stair)
		}
	}
}

func (b *Block) LoadWalls() {
	if b.blockSubtype == balconyBlockSubtype {
		initPos := b.InitPos()
		if b.openings.Get(leftCardinal) {
			initPos.X += blockSizes[b.blockType][baseBlockSubtype].X / 2
		} else if b.openings.Get(rightCardinal) {
			initPos.X -= blockSizes[b.blockType][baseBlockSubtype].X / 2
		}
		b.SetInitPos(initPos)
	}

	pos := b.InitPos()
	x := pos.X
	y := pos.Y
	dim := b.Dim()
	width := dim.X
	height := dim.Y

	switch (b.blockSubtype) {
	case balconyBlockSubtype:
		if b.openings.Get(leftCardinal) {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width, b.thick), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(floor))

			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width, y), NewVec2(b.thick, height), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		} else if b.openings.Get(rightCardinal) {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width, b.thick), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(floor))

			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width, y), NewVec2(b.thick, height), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(left))
		}
	case roofBlockSubtype:
		if b.openings.Get(bottomCardinal) {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(left))
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		} else {
			floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, b.thick), bottomOrigin)
			b.objects = append(b.objects, NewWall(floor))
		}

		if !b.openings.Get(leftCardinal) {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2(b.thick, 1), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(left))
		}

		if !b.openings.Get(rightCardinal) {
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2(b.thick, 1), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		}
	default:
		if b.openings.Get(bottomCardinal) {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(left))
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		} else {
			floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, b.thick), bottomOrigin)
			b.objects = append(b.objects, NewWall(floor))
		}

		leftOpening := 0.0
		if b.openings.Get(leftCardinal) {
			leftOpening = b.sideOpening
		}
		left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y + leftOpening * height), NewVec2(b.thick, (1.0 - leftOpening) * height), bottomLeftOrigin)
		b.objects = append(b.objects, NewWall(left))

		rightOpening := 0.0
		if b.openings.Get(rightCardinal) {
			rightOpening = b.sideOpening
		}
		right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y + rightOpening * height), NewVec2(b.thick, (1.0 - rightOpening) * height), bottomRightOrigin)
		b.objects = append(b.objects, NewWall(right))
	}
}

func (b *Block) UpsertToGrid(g *Grid) {
	for _, obj := range(b.GetObjects()) {
		obj.SetId(g.NextId(obj.GetSpace()))
		g.Upsert(obj)
	}

	b.SetId(g.NextId(blockSpace))
	g.Upsert(b)
}