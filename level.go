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
	i := 0
	object := NewObjectInitData(Init { Id: i, Pos: NewVec2(4, -4), Dim: NewVec2(8, 8), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(4, 2), Dim: NewVec2(3.0, 0.2), })
	g.addObject(object)
	g.grid.Get(Id(objectIdSpace, i)).(*Object).SetProfileOptions(PlatformProfileOptions())

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(16, -3), Dim: NewVec2(8, 8), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(13.5, 2.9), Dim: NewVec2(3, 0.2), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(18.5, 2.9), Dim: NewVec2(3, 0.2), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(12.1, 4), Dim: NewVec2(0.2, 2), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(16, 4.9), Dim: NewVec2(8, 0.2), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(19.9, 2), Dim: NewVec2(0.2, 2), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(27, -3), Dim: NewVec2(10, 12), })
	g.addObject(object)

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(24, 5), Dim: NewVec2(3, 0.2), })
	g.addObject(object)
	g.grid.Get(Id(objectIdSpace, i)).(*Object).SetProfileOptions(PlatformProfileOptions())

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(30, 5), Dim: NewVec2(3, 0.2), })
	g.addObject(object)
	g.grid.Get(Id(objectIdSpace, i)).(*Object).SetProfileOptions(PlatformProfileOptions())

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(27, 7), Dim: NewVec2(3, 0.2), })
	g.addObject(object)
	g.grid.Get(Id(objectIdSpace, i)).(*Object).SetProfileOptions(PlatformProfileOptions())


	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(10, -1), Dim: NewVec2(3, 0.2), })
	g.addObject(object)
	g.grid.Get(Id(objectIdSpace, i)).(*Object).SetProfileOptions(PlatformProfileOptions())
	g.grid.Get(Id(objectIdSpace, i)).(*Object).update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
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

	i++
	object = NewObjectInitData(Init { Id: i, Pos: NewVec2(16, 7), Dim: NewVec2(3, 0.2), })
	g.addObject(object)
	g.grid.Get(Id(objectIdSpace, i)).(*Object).SetProfileOptions(PlatformProfileOptions())
	g.grid.Get(Id(objectIdSpace, i)).(*Object).update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
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