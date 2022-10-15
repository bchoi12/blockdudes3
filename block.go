package main

type BlockType uint8
const (
	unknownBlock BlockType = iota
	archBlock
	gapBlock
)

type BlockTemplate uint8
const (
	unknownBlockTemplate BlockTemplate = iota
	weaponsBlockTemplate
	tableBlockTemplate
)

type SidedBlockTemplate uint8
const (
	unknownSidedBlockTemplate SidedBlockTemplate = iota
	stairsSidedBlockTemplate
)

var blockSizes = map[SpaceType]map[BlockType]Vec2 {
	mainBlockSpace: {
		archBlock: NewVec2(12, 6),
	},
	roofBlockSpace: {
		archBlock: NewVec2(12, 1),
	},
	balconyBlockSpace: {
		archBlock: NewVec2(3, 2),
	},
}

var blockDimZs = map[BlockType]float64 {
	archBlock: 8.0,
}

type Block interface {
	Object

	AddObject(object Object)
	GetObjects() []Object
	GetThickness() float64
	GetBlockType() BlockType

	SetBlockType(blockType BlockType)

	AddOpenings(cardinals ...CardinalType)
	AnyOpenings(cardinals ...CardinalType) bool
	GetOpening(cardinal CardinalType) bool

	Append(block Block)
	Load()
	UpsertToGrid(g *Grid)
}

type BaseBlock struct {
	BaseObject

	blockType BlockType
	openings Cardinal
	thick float64
	sideOpening float64

	addonBlocks []Block
	objects []Object
}

func NewBaseBlock(init Init) BaseBlock {
	return BaseBlock {
		BaseObject: NewRec2Object(init),

		blockType: unknownBlock,
		openings: NewCardinal(),
		thick: 0,
		sideOpening: 0,

		addonBlocks: make([]Block, 0),
		objects: make([]Object, 0),
	}
}

func (bb *BaseBlock) AddObject(object Object) {
	bb.objects = append(bb.objects, object)
}

func (bb BaseBlock) GetObjects() []Object {
	return bb.objects
}

func (bb BaseBlock) GetThickness() float64 {
	return bb.thick
}

func (bb BaseBlock) GetBlockType() BlockType {
	return bb.blockType
}

func (bb *BaseBlock) SetBlockType(blockType BlockType) {
	switch (blockType) {
	case archBlock:
		bb.thick = 0.5
		bb.sideOpening = 0.75
		bb.SetIntAttribute(secondaryColorIntAttribute, archWhite)
	default:
		return
	}

	bb.blockType = blockType
	bb.SetByteAttribute(typeByteAttribute, uint8(blockType))
}

func (bb *BaseBlock) AddOpenings(cardinals ...CardinalType) {
	for _, cardinal := range(cardinals) {
		bb.openings.Add(cardinal)
	}
	bb.SetByteAttribute(openingByteAttribute, bb.openings.ToByte())
}

func (bb BaseBlock) AnyOpenings(cardinals ...CardinalType) bool {
	for _, cardinal := range(cardinals) {
		if bb.openings.Get(cardinal) {
			return true
		}
	}
	return false
}

func (bb BaseBlock) GetOpening(cardinal CardinalType) bool {
	return bb.openings.Get(cardinal)
}

func (bb *BaseBlock) Append(block Block) {
	bb.addonBlocks = append(bb.addonBlocks, block)
}

func (bb *BaseBlock) Load() {
	for _, addon := range(bb.addonBlocks) {
		addon.Load()
	}
}

func (bb *BaseBlock) UpsertToGrid(g *Grid) {
	for _, addon := range(bb.addonBlocks) {
		addon.UpsertToGrid(g)
	}

	for _, obj := range(bb.GetObjects()) {
		obj.SetId(g.NextId(obj.GetSpace()))
		obj.AddAttribute(fromLevelAttribute)
		g.Upsert(obj)
	}

	bb.SetId(g.NextId(bb.GetSpace()))
	bb.AddAttribute(fromLevelAttribute)
	g.Upsert(bb)
}