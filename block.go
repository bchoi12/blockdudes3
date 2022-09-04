package main

type BlockType uint8
const (
	unknownBlockType BlockType = iota

	testBlock
	archBlock
	archBlockRoof
	archBlockBalcony
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

func (b *Block) Load() {
	blockType, _ := b.GetByteAttribute(typeByteAttribute)
	pos := b.Pos()
	x := pos.X
	y := pos.Y
	dim := b.Dim()
	width := dim.X
	height := dim.Y
	thick := 0.5
	opening, hasOpening := b.GetByteAttribute(openingByteAttribute)
	leftPercent := 0.0
	rightPercent := 0.0
	leftOpening := hasOpening && opening & 1 == 1
	rightOpening := hasOpening && (opening >> 1) & 1 == 1

	switch (BlockType(blockType)) {
	case testBlock:
	case archBlock:
		floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(b.Dim().X, thick), bottomOrigin)
		b.objects = append(b.objects, NewWall(floor))

		if leftOpening {
			leftPercent = 0.75
		}
		if rightOpening {
			rightPercent = 0.75
		}

		left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y + leftPercent * height), NewVec2(thick, (1.0 - leftPercent) * height), bottomLeftOrigin)
		b.objects = append(b.objects, NewWall(left))
		right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y + rightPercent * height), NewVec2(thick, (1.0 - rightPercent) * height), bottomRightOrigin)
		b.objects = append(b.objects, NewWall(right))
	case archBlockRoof:
		floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, thick), bottomOrigin)
		b.objects = append(b.objects, NewWall(floor))

		if !leftOpening {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y + thick), NewVec2(thick, thick), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(left))
		}

		if !rightOpening {
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y + thick), NewVec2(thick, thick), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		}
	case archBlockBalcony:
		if leftOpening {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width / 2, thick), bottomLeftOrigin)
			b.objects = append(b.objects, NewWall(floor))

			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2(thick, height), bottomRightOrigin)
			b.objects = append(b.objects, NewWall(right))
		}
	}
}