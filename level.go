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

func (g *Game) createInit(space SpaceType, pos Vec2, dim Vec2) Init {
	return NewInit(g.grid.NextSpacedId(space), NewInitData(pos, dim))
}

func (g *Game) createInitBL(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X + dim.X/2, pos.Y + dim.Y/2)
	return g.createInit(space, centered, dim)
}

func (g *Game) createInitB(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X, pos.Y + dim.Y/2)
	return g.createInit(space, centered, dim)
}

func (g *Game) createInitBR(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X - dim.X/2, pos.Y + dim.Y/2)
	return g.createInit(space, centered, dim)
}

// TODO: currently loading is done twice in WASM and over network
func (g *Game) loadTestLevel() {
	g.add(g.createInitBL(wallSpace, NewVec2(0, -6), NewVec2(8, 12)))
	g.add(g.createInit(platformSpace, NewVec2(4, 8), NewVec2(3, 0.2)))

	g.add(g.createInit(platformSpace, NewVec2(11, 2), NewVec2(3, 0.2)))
	g.grid.GetLast(platformSpace).(*Platform).SetVel(NewVec2(0, 2))
	g.grid.GetLast(platformSpace).(*Platform).SetYBounds(2, 5)

	g.add(g.createInitBL(wallSpace, NewVec2(14, -6), NewVec2(16, 10)))
	g.add(g.createInitBL(wallSpace, NewVec2(14, 9), NewVec2(16, 0.5)))
	g.add(g.createInitBL(wallSpace, NewVec2(14, 7), NewVec2(0.5, 2)))
	g.add(g.createInitB(wallSpace, NewVec2(22, 4), NewVec2(2, 2)))
	g.add(g.createInitB(pickupSpace, NewVec2(22, 6), NewVec2(1, 1)))
	g.grid.GetLast(pickupSpace).(*Pickup).SetWeaponType(uziWeapon)
	g.add(g.createInitBR(wallSpace, NewVec2(30, 7), NewVec2(0.5, 2)))

	g.add(g.createInit(platformSpace, NewVec2(18, 11.5), NewVec2(3, 0.2)))
	g.add(g.createInit(platformSpace, NewVec2(22, 13.5), NewVec2(3, 0.2)))
	g.add(g.createInit(platformSpace, NewVec2(26, 11.5), NewVec2(3, 0.2)))

	g.add(g.createInit(platformSpace, NewVec2(33, 2), NewVec2(3, 0.2)))
	g.grid.GetLast(platformSpace).(*Platform).SetVel(NewVec2(0, 2))
	g.grid.GetLast(platformSpace).(*Platform).SetYBounds(2, 5)

	g.add(g.createInitBL(wallSpace, NewVec2(36, -6), NewVec2(8, 12)))
	g.add(g.createInit(platformSpace, NewVec2(40, 8), NewVec2(3, 0.2)))
}