package main

type BalconyBlock struct {
	BaseBlock
}

func NewBalconyBlock(init Init) *BalconyBlock {
	bb := &BalconyBlock {
		BaseBlock: NewBaseBlock(init),
	}
	return bb
}

func (bb *BalconyBlock) Load() {
	bb.BaseBlock.Load()

	pos := bb.InitPos()
	x := pos.X
	y := pos.Y
	dim := bb.Dim()
	width := dim.X
	height := dim.Y

	switch (bb.GetBlockType()) {
	case archBlock:
		if bb.InitDir().X > 0 {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width, bb.GetThickness()), bottomLeftCardinal)
			bb.objects = append(bb.objects, NewWall(floor))

			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width, y), NewVec2(bb.GetThickness(), height), bottomRightCardinal)
			bb.objects = append(bb.objects, NewWall(right))
		} else if bb.InitDir().X < 0 {
			floor := NewInitC(Id(wallSpace, 0), NewVec2(x, y), NewVec2(width, bb.GetThickness()), bottomRightCardinal)
			bb.objects = append(bb.objects, NewWall(floor))

			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width, y), NewVec2(bb.GetThickness(), height), bottomLeftCardinal)
			bb.objects = append(bb.objects, NewWall(left))
		}
	}
}