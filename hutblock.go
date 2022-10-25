package main

type HutBlock struct {
	BaseBlock
}

func NewHutBlock(init Init) *HutBlock {
	hb := &HutBlock {
		BaseBlock: NewBaseBlock(init),
	}
	return hb
}

func (hb *HutBlock) Load() {
	hb.BaseBlock.Load()

	pos := hb.PosC(bottomCardinal)
	x := pos.X
	y := pos.Y
	dim := hb.Dim()
	width := dim.X
	height := dim.Y

	switch (hb.GetBlockType()) {
	case archBlock:
		ceil := NewInitC(Id(wallSpace, 0), NewVec2(x, y + height), NewVec2(width, hb.GetThickness()), topCardinal)
		hb.objects = append(hb.objects, NewWall(ceil))

		left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y + height), NewVec2(hb.GetThickness(), 1), topLeftCardinal)
		hb.objects = append(hb.objects, NewWall(left))

		right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y + height), NewVec2(hb.GetThickness(), 1), topRightCardinal)
		hb.objects = append(hb.objects, NewWall(right))
	}
}