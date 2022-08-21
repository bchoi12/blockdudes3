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
	return NewObjectInit(g.grid.NextSpacedId(space), pos, dim)
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
	g.Add(g.createInitBL(wallSpace, NewVec2(0, -6), NewVec2(8, 12)))
	g.Add(g.createInit(wallSpace, NewVec2(4, 8), NewVec2(3, 0.2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)
	g.Add(g.createInitB(pickupSpace, NewVec2(4, 8.1), NewVec2(1.2, 1.2)))
	g.grid.GetLast(pickupSpace).(*Pickup).SetWeaponType(sniperWeapon)

	g.Add(g.createInit(wallSpace, NewVec2(11, 2), NewVec2(3, 0.2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)
	g.grid.GetLast(wallSpace).(*Wall).SetVel(NewVec2(0, 2))
	g.grid.GetLast(wallSpace).(*Wall).SetYBounds(2, 5)
	g.Add(g.createInit(wallSpace, NewVec2(11, 15), NewVec2(1, 1)))

	g.Add(g.createInitBL(wallSpace, NewVec2(14, -6), NewVec2(16, 10)))
	g.Add(g.createInitBL(wallSpace, NewVec2(14, 9), NewVec2(16, 0.5)))
	g.Add(g.createInitBL(wallSpace, NewVec2(14, 7), NewVec2(0.5, 2)))
	g.Add(g.createInitB(wallSpace, NewVec2(22, 4), NewVec2(2, 2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(stairAttribute)
	g.Add(g.createInitBR(wallSpace, NewVec2(21, 4), NewVec2(1, 1.33)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(stairAttribute)
	g.Add(g.createInitBR(wallSpace, NewVec2(20, 4), NewVec2(1, 0.66)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(stairAttribute)
	g.Add(g.createInitBL(wallSpace, NewVec2(23, 4), NewVec2(1, 1.33)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(stairAttribute)
	g.Add(g.createInitBL(wallSpace, NewVec2(24, 4), NewVec2(1, 0.66)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(stairAttribute)
	g.Add(g.createInitB(pickupSpace, NewVec2(22, 6), NewVec2(1.2, 1.2)))
	g.grid.GetLast(pickupSpace).(*Pickup).SetWeaponType(bazookaWeapon)

	g.Add(g.createInitB(pickupSpace, NewVec2(22, 9.5), NewVec2(1.2, 1.2)))
	g.grid.GetLast(pickupSpace).(*Pickup).SetWeaponType(uziWeapon)
	g.Add(g.createInit(wallSpace, NewVec2(18, 11.5), NewVec2(3, 0.2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)
	g.Add(g.createInit(wallSpace, NewVec2(22, 13.5), NewVec2(3, 0.2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)
	g.grid.GetLast(wallSpace).(*Wall).SetVel(NewVec2(2, 2))
	g.grid.GetLast(wallSpace).(*Wall).SetXBounds(22, 24)
	g.grid.GetLast(wallSpace).(*Wall).SetYBounds(13.5, 15.5)
	g.Add(g.createInit(wallSpace, NewVec2(26, 11.5), NewVec2(3, 0.2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)

	g.Add(g.createInit(wallSpace, NewVec2(33, 2), NewVec2(3, 0.2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)
	g.grid.GetLast(wallSpace).(*Wall).SetVel(NewVec2(0, 2))
	g.grid.GetLast(wallSpace).(*Wall).SetYBounds(2, 5)
	g.Add(g.createInit(wallSpace, NewVec2(33, 15), NewVec2(1, 1)))

	g.Add(g.createInitBL(wallSpace, NewVec2(36, -6), NewVec2(8, 12)))
	g.Add(g.createInit(wallSpace, NewVec2(40, 8), NewVec2(3, 0.2)))
	g.grid.GetLast(wallSpace).(*Wall).AddAttribute(platformAttribute)
	g.Add(g.createInitB(pickupSpace, NewVec2(40, 8.1), NewVec2(1.2, 1.2)))
	g.grid.GetLast(pickupSpace).(*Pickup).SetWeaponType(starWeapon)
}