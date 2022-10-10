package main

const (
	buildingStartY float64 = -9.0
)

type BuildingAttributes struct {
	pos Vec2
	blockType BlockType
	color int
}

type Building struct {
	attributes BuildingAttributes

	currentY float64
	lastBlock *Block
	blocks []*Block
}

func NewBuilding(attributes BuildingAttributes) Building {
	return Building {
		attributes: attributes,
		currentY: attributes.pos.Y,
		blocks: make([]*Block, 0),
	}
}

func (b *Building) AddBlock(subtype BlockSubtype) *Block {
	if subtype != balconyBlockSubtype {
		if b.lastBlock != nil {
			b.currentY += b.lastBlock.Dim().Y
		}
	}

	x := b.attributes.pos.X
	y := b.currentY

	init := NewInit(Id(blockSpace, 0), NewVec2(x, y), blockSizes[b.attributes.blockType][subtype])
	block := NewBlock(init)

	block.SetBlockType(b.attributes.blockType)
	block.SetBlockSubtype(subtype)
	block.SetIntAttribute(colorIntAttribute, b.attributes.color)

	if subtype == baseBlockSubtype {
		b.lastBlock = block
	}

	b.blocks = append(b.blocks, block)
	return block
}

func (b *Building) UpsertToGrid(g *Grid) {
	for _, block := range(b.blocks) {
		block.LoadWalls()
		block.UpsertToGrid(g)
	}
}

type BlockGrid struct {
	buildings []Building

	yOffsets []float64
	curOffset int
}

func NewBlockGrid() BlockGrid {
	bg := BlockGrid {
		buildings: make([]Building, 0),
	}

	bg.yOffsets = make([]float64, 1)
	bg.yOffsets[0] = 0
	bg.curOffset = 0

	return bg
}

func (bg *BlockGrid) SetYOffsets(offsets ...float64) {
	bg.yOffsets = make([]float64, len(offsets))
	for i, offset := range(offsets) {
		bg.yOffsets[i] = offset
	}
}

func (bg *BlockGrid) GetNextPos(blockType BlockType, gap float64) Vec2 {
	if len(bg.buildings) == 0 {
		return NewVec2(0, bg.nextYPos())
	}

	building := bg.buildings[len(bg.buildings) - 1]
	lastPos := building.attributes.pos

	lastPos.X += blockSizes[building.attributes.blockType][baseBlockSubtype].X / 2
	lastPos.X += gap
	lastPos.X += blockSizes[blockType][baseBlockSubtype].X / 2

	if gap > 0 {
		lastPos.Y = bg.nextYPos()
	}

	return lastPos
}

func (bg *BlockGrid) AddBuilding(building Building) {
	bg.buildings = append(bg.buildings, building)
}

func (bg *BlockGrid) UpsertToGrid(g *Grid) {
	for _, building := range(bg.buildings) {
		building.UpsertToGrid(g)
	}
}

func (bg *BlockGrid) nextYPos() float64 {
	y := buildingStartY + bg.yOffsets[bg.curOffset]
	bg.curOffset += 1
	if bg.curOffset >= len(bg.yOffsets) {
		bg.curOffset = 0
	}

	return y
}