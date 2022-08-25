package main

type BlockDirType uint8
const (
	unknownBlockDir BlockDirType = iota
)

type BlockTemplateType uint8
const (
	unknownBlockTemplate BlockTemplateType = iota

	emptyBlockTemplate
	solidBlockTemplate
)

type Block struct {
	BaseObject

	thickness float64
	objects []Object
}

func NewBlock(init Init) *Block {
	return &Block {
		BaseObject: NewRec2Object(init),
		thickness: 0.5,
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

func (b *Block) SetThickness(thickness float64) {
	b.thickness = thickness
	b.SetInitProp(thicknessProp, thickness)
}

func (b *Block) LoadTemplate(template BlockTemplateType) {
	switch template {
	case solidBlockTemplate:
		init := NewInit(Id(wallSpace, 0), b.Pos(), b.Dim())
		b.objects = append(b.objects, NewWall(init))
		b.SetThickness(0)
	}

	b.SetByteAttribute(typeByteAttribute, uint8(template))
}

func (b *Block) AddHorizontalBorder(yPercent float64, segments ...Pair) {
	for _, pair := range(segments) {
		if pair.B < pair.A {
			pair.Swap()
		}
		length := b.Dim().X * (pair.B - pair.A)
		pos := b.GetRelativePos(NewVec2(pair.A, yPercent), NewVec2(0, b.thickness))
		init := NewInitC(Id(wallSpace, 0), pos, NewVec2(length, b.thickness), leftCenter)
		b.objects = append(b.objects, NewWall(init))
	}
}

func (b *Block) AddVerticalBorder(xPercent float64, segments ...Pair) {
	for _, pair := range(segments) {
		if pair.B < pair.A {
			pair.Swap()
		}
		height := b.Dim().Y * (pair.B - pair.A)
		pos := b.GetRelativePos(NewVec2(xPercent, pair.A), NewVec2(b.thickness, 0))
		init := NewInitC(Id(wallSpace, 0), pos, NewVec2(b.thickness, height), bottomCenter)
		b.objects = append(b.objects, NewWall(init))
	}
}