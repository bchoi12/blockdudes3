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

	// TODO: deprecate tall block
	tallBlockSubtype
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
		tallBlockSubtype: NewVec2(12, 12),
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

	case tableBlockTemplate:
		table := NewWall(NewInitC(Id(wallSpace, 0), NewVec2(x, y + b.thick), NewVec2(3, 1), bottomOrigin))
		table.SetByteAttribute(subtypeByteAttribute, uint8(tableWallSubtype))
		table.AddAttribute(visibleAttribute)
		table.SetIntAttribute(colorIntAttribute, 0x996312)
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
	origin := bottomRightOrigin
	innerDimZ := blockDimZs[b.blockType] - 2 * b.thick
	if cardinal.AnyLeft() {
		dir = -1
		origin = bottomLeftOrigin
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
			stair := NewWall(NewInitC(Id(wallSpace, 0),
				NewVec2(x + dir * (width / 2 - i * stairWidth - b.thick), y + b.thick),
				NewVec2(stairWidth, baseHeight - i * stairHeight), origin))
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
		if b.openings.AnyLeft() {
			initPos.X -= blockSizes[b.blockType][baseBlockSubtype].X / 2
		}
		if b.openings.AnyRight() {
			initPos.X += blockSizes[b.blockType][baseBlockSubtype].X / 2
		}
		if b.openings.AnyTop() {
			initPos.Y += blockSizes[b.blockType][baseBlockSubtype].Y
		}
		b.SetInitPos(initPos)
	}

	pos := b.InitPos()
	x := pos.X
	y := pos.Y
	dim := b.Dim()
	width := dim.X
	height := dim.Y

	baseDim := blockSizes[b.blockType][baseBlockSubtype]
	baseHeight := baseDim.Y

	switch (b.blockSubtype) {
	case baseBlockSubtype:
		if b.openings.AnyBottom() {
			if !b.openings.Get(bottomLeftCardinal) {
				left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2(width / 2, b.thick), bottomLeftOrigin)
				b.objects = append(b.objects, NewWall(left))
			}

			if !b.openings.Get(bottomRightCardinal) {
				right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2(width / 2, b.thick), bottomRightOrigin)
				b.objects = append(b.objects, NewWall(right))
			}
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
	case tallBlockSubtype:
		if b.openings.Get(bottomCardinal) {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(left))
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2((1.0 - b.bottomOpening) / 2 * width, b.thick), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		} else {
			floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, b.thick), bottomOrigin)
			b.objects = append(b.objects, NewWall(floor))
		}

		var cardinals = [4]CardinalType { bottomLeftCardinal, topLeftCardinal, bottomRightCardinal, topRightCardinal }
		var side = [4]float64 { -1, -1, 1, 1}
		var heightOffset = [4]float64 {0, baseHeight, 0, baseHeight}
		var heightExtension = [4]float64 {b.thick, 0, b.thick, 0}
		var centering = [4]OriginType {bottomLeftOrigin, bottomLeftOrigin, bottomRightOrigin, bottomRightOrigin}

		for i := 0; i < len(cardinals); i += 1 {
			opening := 0.0
			if b.openings.Get(cardinals[i]) {
				opening = b.sideOpening
			}

			wall := NewInitC(Id(wallSpace, 0),
				NewVec2(x + side[i] * width / 2, y + heightOffset[i] + opening * baseHeight),
				NewVec2(b.thick, (1.0 - opening) * baseHeight + heightExtension[i]),
				centering[i])
			b.objects = append(b.objects, NewWall(wall))
		}
	case balconyBlockSubtype:
		if b.openings.AnyRight() {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width, b.thick), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(floor))

			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width, y), NewVec2(b.thick, height), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		} else if b.openings.AnyLeft() {
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