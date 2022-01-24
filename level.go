package main

func (g *Game) loadLevel(index LevelIdType) {
	switch index {
	case testLevel:
		g.level = index
		g.loadTestLevel()
	default:
		Debug("Unknown map: %d", index)
	}
}

func (g *Game) loadTestLevel() {
	var id SpacedId
	var init Init

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(4, -4), NewVec2(8, 8)))
	g.add(init)

	id = g.grid.NextSpacedId(platformSpace)
	init = NewInit(id, NewInitData(NewVec2(4, 2), NewVec2(3.0, 0.2)))
	g.add(init)

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(16, -3), NewVec2(8, 8)))
	g.add(init)

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(13.5, 2.9), NewVec2(3, 0.2)))
	g.add(init)

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(18.5, 2.9), NewVec2(3, 0.2)))
	g.add(init)

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(12.1, 4), NewVec2(0.2, 2)))
	g.add(init)

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(16, 4.9), NewVec2(8, 0.2)))
	g.add(init)

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(19.9, 2), NewVec2(0.2, 2)))
	g.add(init)

	id = g.grid.NextSpacedId(wallSpace)
	init = NewInit(id, NewInitData(NewVec2(27, -3), NewVec2(10, 12)))
	g.add(init)

	id = g.grid.NextSpacedId(platformSpace)
	init = NewInit(id, NewInitData(NewVec2(24, 5), NewVec2(3, 0.2)))
	g.add(init)

	id = g.grid.NextSpacedId(platformSpace)
	init = NewInit(id, NewInitData(NewVec2(30, 5), NewVec2(3, 0.2)))
	g.add(init)

	id = g.grid.NextSpacedId(platformSpace)
	init = NewInit(id, NewInitData(NewVec2(27, 7), NewVec2(3, 0.2)))
	g.add(init)


	id = g.grid.NextSpacedId(platformSpace)
	init = NewInit(id, NewInitData(NewVec2(10, -1), NewVec2(3, 0.2)))
	g.add(init)
	g.grid.Get(id).(*Platform).SetVel(NewVec2(0, 2))
	g.grid.Get(id).(*Platform).SetYBounds(-1, 4)

	id = g.grid.NextSpacedId(platformSpace)
	init = NewInit(id, NewInitData(NewVec2(16, 7), NewVec2(3, 0.2)))
	g.add(init)
	g.grid.Get(id).(*Platform).SetVel(NewVec2(2, 0))
	g.grid.Get(id).(*Platform).SetXBounds(14, 18)
}