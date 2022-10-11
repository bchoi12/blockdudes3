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
	tableBlockTemplate
)

type SidedBlockTemplate uint8
const (
	unknownSidedBlockTemplate SidedBlockTemplate = iota
	stairsSidedBlockTemplate
	secondFloorSidedBlockTemplate
)

var blockSizes = map[BlockType]map[BlockSubtype]Vec2 {
	archBlock: {
		baseBlockSubtype: NewVec2(12, 6),
		roofBlockSubtype: NewVec2(12, 1),
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

func (b Block) GetObjects() []Object {
	return b.objects
}

func (b Block) Thickness() float64 {
	return b.thick
}

func (b Block) GetBlockType() BlockType {
	return b.blockType
}

func (b Block) GetBlockSubtype() BlockSubtype {
	return b.blockSubtype
}

func (b *Block) SetBlockType(blockType BlockType) {
	switch (blockType) {
	case archBlock:
		b.thick = 0.5
		b.sideOpening = 0.75
		b.bottomOpening = 0.5
		b.SetIntAttribute(secondaryColorIntAttribute, archSecondary)
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

func (b Block) GetOpening(cardinal CardinalType) bool {
	return b.openings.Get(cardinal)
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

	switch (template) {
	case weaponsBlockTemplate:
		uzi := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 3, y + b.thick), NewVec2(1.2, 1.2), bottomCardinal))
		uzi.SetByteAttribute(typeByteAttribute, uint8(uziWeapon))
		uzi.SetByteAttribute(subtypeByteAttribute, uint8(grapplingHookWeapon))
		b.objects = append(b.objects, uzi)

		star := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 9, y + b.thick), NewVec2(1.2, 1.2), bottomCardinal))
		star.SetByteAttribute(typeByteAttribute, uint8(starWeapon))
		star.SetByteAttribute(subtypeByteAttribute, uint8(boosterEquip))
		b.objects = append(b.objects, star)

		bazooka := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 9, y + b.thick), NewVec2(1.2, 1.2), bottomCardinal))
		bazooka.SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))
		bazooka.SetByteAttribute(subtypeByteAttribute, uint8(jetpackEquip))
		b.objects = append(b.objects, bazooka)

		sniper := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 3, y + b.thick), NewVec2(1.2, 1.2), bottomCardinal))
		sniper.SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))
		sniper.SetByteAttribute(subtypeByteAttribute, uint8(chargerEquip))
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

	case tableBlockTemplate:
		table := NewWall(NewInitC(Id(wallSpace, 0), NewVec2(x, y + b.thick), NewVec2(3, 1), bottomCardinal))
		table.SetByteAttribute(subtypeByteAttribute, uint8(tableWallSubtype))
		table.AddAttribute(visibleAttribute)
		table.SetIntAttribute(colorIntAttribute, tableColor)
		b.objects = append(b.objects, table)
	}
}

func (b *Block) LoadSidedTemplate(template SidedBlockTemplate, cardinal Cardinal) {
	pos := b.InitPos()
	x := pos.X
	y := pos.Y
	dim := b.Dim()
	width := dim.X

	baseDim := blockSizes[b.blockType][baseBlockSubtype]
	baseHeight := baseDim.Y

	dir := 1.0
	origin := bottomRightCardinal
	innerDimZ := blockDimZs[b.blockType] - 2 * b.thick
	if cardinal.AnyLeft() {
		dir = -1
		origin = bottomLeftCardinal
	}

	switch (template) {
	case stairsSidedBlockTemplate:
		wall := NewWall(NewInitC(Id(wallSpace, 0),
			NewVec2(x + dir * width / 2, y + b.thick),
			NewVec2(b.thick, baseHeight), origin))
		wall.AddAttribute(visibleAttribute)
		wall.SetFloatAttribute(dimZFloatAttribute, innerDimZ / 2)
		if color, ok := b.GetIntAttribute(secondaryColorIntAttribute); ok {
			wall.SetIntAttribute(colorIntAttribute, color)
		}
		b.objects = append(b.objects, wall)

		numStairs := 8.0
		stairWidth := baseHeight / numStairs
		stairHeight := stairWidth
		for i := 0.0; i < numStairs; i += 1 {
			stairInit := NewInitC(Id(wallSpace, 0),
				NewVec2(x + dir * (width / 2 - i * stairWidth - b.thick), y + b.thick),
				NewVec2(stairWidth, baseHeight - i * stairHeight), origin)
			stairInit.SetInitDir(NewVec2(-dir, 0))
			stair := NewWall(stairInit)
			stair.SetByteAttribute(typeByteAttribute, uint8(stairWall))
			stair.AddAttribute(visibleAttribute)
			stair.SetFloatAttribute(dimZFloatAttribute, innerDimZ / 2)

			if color, ok := b.GetIntAttribute(secondaryColorIntAttribute); ok {
				stair.SetIntAttribute(colorIntAttribute, color)
			}

			b.objects = append(b.objects, stair)
		}

	case secondFloorSidedBlockTemplate:
		wall := NewWall(NewInitC(Id(wallSpace, 0),
			NewVec2(x + dir * width / 2, y + baseHeight),
			NewVec2(width / 2, b.thick), origin))
		wall.AddAttribute(visibleAttribute)
		wall.SetFloatAttribute(dimZFloatAttribute, innerDimZ)
		if color, ok := b.GetIntAttribute(secondaryColorIntAttribute); ok {
			wall.SetIntAttribute(colorIntAttribute, color)
		}
		b.objects = append(b.objects, wall)
	}
}

func (b *Block) LoadWalls() {
	if b.blockSubtype == balconyBlockSubtype {
		initPos := b.InitPos()
		if b.InitDir().X < 0 {
			initPos.X -= blockSizes[b.blockType][baseBlockSubtype].X / 2
		}
		if b.InitDir().X > 0 {
			initPos.X += blockSizes[b.blockType][baseBlockSubtype].X / 2
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
	case baseBlockSubtype:
		if b.openings.AnyBottom() {
			if !b.openings.Get(bottomLeftCardinal) {
				left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2(width / 2, b.thick), bottomLeftCardinal)
				b.objects = append(b.objects, NewWall(left))
			}

			if !b.openings.Get(bottomRightCardinal) {
				right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2(width / 2, b.thick), bottomRightCardinal)
				b.objects = append(b.objects, NewWall(right))
			}
		} else {
			floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, b.thick), bottomCardinal)
			b.objects = append(b.objects, NewWall(floor))
		}

		leftOpening := 0.0
		if b.openings.Get(leftCardinal) {
			leftOpening = b.sideOpening
		}
		left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y + leftOpening * height), NewVec2(b.thick, (1.0 - leftOpening) * height), bottomLeftCardinal)
		b.objects = append(b.objects, NewWall(left))

		rightOpening := 0.0
		if b.openings.Get(rightCardinal) {
			rightOpening = b.sideOpening
		}
		right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y + rightOpening * height), NewVec2(b.thick, (1.0 - rightOpening) * height), bottomRightCardinal)
		b.objects = append(b.objects, NewWall(right))
	case balconyBlockSubtype:
		if b.InitDir().X > 0 {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width, b.thick), bottomLeftCardinal)
			b.objects = append(b.objects, NewWall(floor))

			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width, y), NewVec2(b.thick, height), bottomRightCardinal)
			b.objects = append(b.objects, NewWall(right))
		} else if b.InitDir().X < 0 {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width, b.thick), bottomRightCardinal)
			b.objects = append(b.objects, NewWall(floor))

			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width, y), NewVec2(b.thick, height), bottomLeftCardinal)
			b.objects = append(b.objects, NewWall(left))
		}
	case roofBlockSubtype:
		if b.openings.Get(bottomCardinal) {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomLeftCardinal)
			b.objects = append(b.objects, NewWall(left))
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomRightCardinal)
			b.objects = append(b.objects, NewWall(right))
		} else {
			floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, b.thick), bottomCardinal)
			b.objects = append(b.objects, NewWall(floor))
		}

		if !b.openings.Get(leftCardinal) {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2(b.thick, 1), bottomLeftCardinal)
			b.objects = append(b.objects, NewWall(left))
		}

		if !b.openings.Get(rightCardinal) {
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2(b.thick, 1), bottomRightCardinal)
			b.objects = append(b.objects, NewWall(right))
		}
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