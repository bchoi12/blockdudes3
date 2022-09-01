package main

type BlockType uint8
const (
	unknownBlockType BlockType = iota

	testBlock
	archBlock
	archBlockRoof
)

type Block struct {
	BaseObject

	objects []Object
}

func NewBlock(init Init) *Block {
	return &Block {
		BaseObject: NewRec2Object(init),
		objects: make([]Object, 0),
	}
}

func (b Block) GetRelativePos(percent Vec2, buffer Vec2) Vec2 {
	pos := b.Pos()
	dim := b.Dim()
	return NewVec2(pos.X - dim.X/2 + buffer.X/2 + percent.X * (dim.X - buffer.X),
				   pos.Y - dim.Y/2 + buffer.Y/2 + percent.Y * (dim.Y - buffer.Y))
}

func (b Block) GetObjects() []Object {
	return b.objects
}