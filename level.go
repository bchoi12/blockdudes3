package main

type LevelIdType uint8
const (
	unknownLevel LevelIdType = iota
	testLevel
)

type Level struct {
	id LevelIdType
	grid *Grid
}

func NewLevel(grid *Grid) *Level {
	return &Level {
		id: unknownLevel,
		grid: grid,
	}
}

func (l Level) GetId() LevelIdType {
	return l.id
}

func (l *Level) LoadLevel(id LevelIdType) {
	l.id = id

	switch id {
	case testLevel:
		l.loadTestLevel()
	default:
		Debug("Unknown map: %d", id)
	}
}

func (l Level) createInit(space SpaceType, pos Vec2, dim Vec2) Init {
	return NewInit(l.grid.NextSpacedId(space), pos, dim)
}

func (l Level) createInitBL(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X + dim.X/2, pos.Y + dim.Y/2)
	return l.createInit(space, centered, dim)
}

func (l Level) createInitB(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X, pos.Y + dim.Y/2)
	return l.createInit(space, centered, dim)
}

func (l Level) createInitBR(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X - dim.X/2, pos.Y + dim.Y/2)
	return l.createInit(space, centered, dim)
}

// TODO: currently loading is done via WASM then sent redundantly over network & skipped
func (l *Level) loadTestLevel() {
	g := l.grid

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(4, -10), NewVec2(12, 10), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 1))
		block.AddVerticalBorder(0, NewPair(0, 1))
		block.AddVerticalBorder(1, NewPair(0, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 6)
			g.Upsert(object)
		}
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(4, 0), NewVec2(8, 4), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 5)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 1))
		block.AddVerticalBorder(0, NewPair(0, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 4)
			g.Upsert(object)
		}
	}

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(4, 0), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(4, 3), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, spotLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFFFFFF)
	g.GetLast(lightSpace).SetInitProp(posZProp, 1)
	g.GetLast(lightSpace).SetDir(NewVec2(0, -1))

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(22, -10), NewVec2(20, 10), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 6)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 1))
		block.AddVerticalBorder(0, NewPair(0, 1))
		block.AddVerticalBorder(1, NewPair(0, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 5)
			g.Upsert(object)
		}
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(22, 0), NewVec2(16, 6), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 5)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 0.3), NewPair(0.7, 1))
		block.AddVerticalBorder(0, NewPair(0.5, 1))
		block.AddVerticalBorder(1, NewPair(0.5, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 4)
			g.Upsert(object)
		}
	}

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(17, 5), NewVec2(8, 8))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, spotLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFF6666)
	g.GetLast(lightSpace).SetInitProp(posZProp, 1)
	g.GetLast(lightSpace).SetDir(NewVec2(0, -1))

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(27, 5), NewVec2(8, 8))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, spotLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0x6666FF)
	g.GetLast(lightSpace).SetInitProp(posZProp, 1)
	g.GetLast(lightSpace).SetDir(NewVec2(0, -1))


	g.Upsert(g.New(l.createInitB(wallSpace, NewVec2(22, 0), NewVec2(2, 2))))
	g.GetLast(wallSpace).AddAttribute(stairAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 4)
	g.Upsert(g.New(l.createInitBR(wallSpace, NewVec2(21, 0), NewVec2(1, 1.33))))
	g.GetLast(wallSpace).AddAttribute(stairAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 4)
	g.Upsert(g.New(l.createInitBR(wallSpace, NewVec2(20, 0), NewVec2(1, 0.66))))
	g.GetLast(wallSpace).AddAttribute(stairAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 4)
	g.Upsert(g.New(l.createInitBL(wallSpace, NewVec2(23, 0), NewVec2(1, 1.33))))
	g.GetLast(wallSpace).AddAttribute(stairAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 4)
	g.Upsert(g.New(l.createInitBL(wallSpace, NewVec2(24, 0), NewVec2(1, 0.66))))
	g.GetLast(wallSpace).AddAttribute(stairAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 4)
	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(22, 2), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(uziWeapon))

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(22, 6), NewVec2(12, 6), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 4)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 0.3), NewPair(0.7, 1))
		block.AddVerticalBorder(0, NewPair(0.5, 1))
		block.AddVerticalBorder(1, NewPair(0.5, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 3)
			g.Upsert(object)
		}
	}

	g.Upsert(g.New(l.createInit(wallSpace, NewVec2(22, 8), NewVec2(3, 0.2))))
	g.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 3)
	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(22, 8.1), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))

	g.Upsert(g.New(l.createInit(wallSpace, NewVec2(22, 14), NewVec2(3, 0.2))))
	g.GetLast(wallSpace).AddAttribute(platformAttribute)
	g.GetLast(wallSpace).(*Wall).SetSpeed(2)
	g.GetLast(wallSpace).(*Wall).AddWaypoint(NewVec2(20, 14))
	g.GetLast(wallSpace).(*Wall).AddWaypoint(NewVec2(24, 14))
	g.GetLast(wallSpace).SetInitProp(dimZProp, 3)


	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(40, -10), NewVec2(8, 8), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(-0.25, 1))
		block.AddVerticalBorder(0, NewPair(0, 1))
		block.AddVerticalBorder(1, NewPair(0, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 6)
			g.Upsert(object)
		}
	}
	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(40, -2), NewVec2(8, 4), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 6)
			g.Upsert(object)
		}
	}

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(40, 1), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, spotLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xAD07DB)
	g.GetLast(lightSpace).SetInitProp(posZProp, 1)
	g.GetLast(lightSpace).SetDir(NewVec2(0, -1))

	g.Upsert(g.New(l.createInit(wallSpace, NewVec2(40, 4), NewVec2(3, 0.2))))
	g.GetLast(wallSpace).AddAttribute(platformAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 4)
	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(40, 2), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(starWeapon))

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(56, -10), NewVec2(8, 8), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 1.25))
		block.AddVerticalBorder(0, NewPair(0, 1))
		block.AddVerticalBorder(1, NewPair(0, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 6)
			g.Upsert(object)
		}
	}
	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(56, -2), NewVec2(8, 4), bottomCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		block.AddHorizontalBorder(1, NewPair(0, 1))
		g.Upsert(block)
		for _, object := range(block.GetObjects()) {
			object.SetId(g.NextId(object.GetSpace()))
			object.SetInitProp(dimZProp, 6)
			g.Upsert(object)
		}
	}

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(56, 1), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, spotLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xC306D1)
	g.GetLast(lightSpace).SetInitProp(posZProp, 1)
	g.GetLast(lightSpace).SetDir(NewVec2(0, -1))

	g.Upsert(g.New(l.createInit(wallSpace, NewVec2(48, -2.25), NewVec2(8, 0.5))))
	g.GetLast(wallSpace).SetInitProp(dimZProp, 7)
	g.Upsert(g.New(l.createInit(wallSpace, NewVec2(48, 8), NewVec2(8, 0.2))))
	g.GetLast(wallSpace).AddAttribute(platformAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 7)

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(46, -2), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, floorLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFFFFFF)
	g.GetLast(lightSpace).SetInitProp(posZProp, 2.5)
	g.GetLast(lightSpace).SetDir(NewVec2(0, 1))

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(48, -2), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, floorLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFFFFFF)
	g.GetLast(lightSpace).SetInitProp(posZProp, 2.5)
	g.GetLast(lightSpace).SetDir(NewVec2(0, 1))

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(50, -2), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, floorLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFFFFFF)
	g.GetLast(lightSpace).SetInitProp(posZProp, 2.5)
	g.GetLast(lightSpace).SetDir(NewVec2(0, 1))

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(46, -2), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, floorLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFFFFFF)
	g.GetLast(lightSpace).SetInitProp(posZProp, -2.5)
	g.GetLast(lightSpace).SetDir(NewVec2(0, 1))

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(48, -2), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, floorLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFFFFFF)
	g.GetLast(lightSpace).SetInitProp(posZProp, -2.5)
	g.GetLast(lightSpace).SetDir(NewVec2(0, 1))

	g.Upsert(g.New(l.createInit(lightSpace, NewVec2(50, -2), NewVec2(6, 6))))
	g.GetLast(lightSpace).SetByteAttribute(typeByteAttribute, floorLight)
	g.GetLast(lightSpace).SetByteAttribute(juiceByteAttribute, 60)
	g.GetLast(lightSpace).SetInitProp(colorProp, 0xFFFFFF)
	g.GetLast(lightSpace).SetInitProp(posZProp, -2.5)
	g.GetLast(lightSpace).SetDir(NewVec2(0, 1))

	g.Upsert(g.New(l.createInit(wallSpace, NewVec2(56, 4), NewVec2(3, 0.2))))
	g.GetLast(wallSpace).AddAttribute(platformAttribute)
	g.GetLast(wallSpace).SetInitProp(dimZProp, 4)
}