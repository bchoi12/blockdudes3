package main

const (
	unknownLevel int = iota
	testLevel
)

func (g *Game) loadLevel(index int) {
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

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(4, -4), NewVec2(8, 8))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(4, 2), NewVec2(3.0, 0.2))
	g.add(init)
	g.grid.Get(id).(*Object).SetProfileOptions(PlatformProfileOptions())

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(16, -3), NewVec2(8, 8))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(13.5, 2.9), NewVec2(3, 0.2))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(18.5, 2.9), NewVec2(3, 0.2))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(12.1, 4), NewVec2(0.2, 2))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(16, 4.9), NewVec2(8, 0.2))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(19.9, 2), NewVec2(0.2, 2))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(27, -3), NewVec2(10, 12))
	g.add(init)

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(24, 5), NewVec2(3, 0.2))
	g.add(init)
	g.grid.Get(id).(*Object).SetProfileOptions(PlatformProfileOptions())

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(30, 5), NewVec2(3, 0.2))
	g.add(init)
	g.grid.Get(id).(*Object).SetProfileOptions(PlatformProfileOptions())

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(27, 7), NewVec2(3, 0.2))
	g.add(init)
	g.grid.Get(id).(*Object).SetProfileOptions(PlatformProfileOptions())


	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(10, -1), NewVec2(3, 0.2))
	g.add(init)
	g.grid.Get(id).(*Object).SetProfileOptions(PlatformProfileOptions())
	g.grid.Get(id).(*Object).update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
		switch prof := (o.Profile).(type) {
		case *Rec2:
			pos := prof.Pos()
			vel := prof.Vel()
			if vel.IsZero() {
				vel.Y = 2
			}
			if prof.Pos().Y > 4 && vel.Y > 0 {
				vel.Y = -Abs(vel.Y)
			}
			if prof.Pos().Y < -1 && vel.Y < 0 {
				vel.Y = Abs(vel.Y)
			}
			pos.Add(vel, ts)
			prof.SetVel(vel)
			prof.SetPos(pos)
		default:
			return
		}
	}

	id = g.grid.NextSpacedId(objectIdSpace)
	init = NewInit(id, wallObjectClass, NewVec2(16, 7), NewVec2(3, 0.2))
	g.add(init)
	g.grid.Get(id).(*Object).SetProfileOptions(PlatformProfileOptions())
	g.grid.Get(id).(*Object).update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
		switch prof := (o.Profile).(type) {
		case *Rec2:
			pos := prof.Pos()
			vel := prof.Vel()
			if vel.IsZero() {
				vel.X = 2
			}
			if prof.Pos().X > 18 && vel.X > 0 {
				vel.X = -Abs(vel.X)
			}
			if prof.Pos().X < 14 && vel.X < 0 {
				vel.X = Abs(vel.X)
			}
			pos.Add(vel, ts)
			prof.SetVel(vel)
			prof.SetPos(pos)
		default:
			return
		}
	}
}