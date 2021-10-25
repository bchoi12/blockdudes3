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
	objects := make(map[int]ObjectInitData)

	i := 0
	objects[i] = ObjectInitData {
		Pos: NewVec2(5, 0.9),
		Dim: NewVec2(20.0, 0.2),
	}

	i++
	objects[i] = ObjectInitData {
		Pos: NewVec2(1, 3),
		Dim: NewVec2(3.0, 0.2),
	}

	i++
	objects[i] = ObjectInitData {
		Pos: NewVec2(4.5, 5),
		Dim: NewVec2(3.0, 0.2),
	}

	i++
	objects[i] = ObjectInitData {
		Pos: NewVec2(4, 0),
		Dim: NewVec2(0.2, 0.2),
	}

	i++
	objects[i] = ObjectInitData {
		Pos: NewVec2(8, 0),
		Dim: NewVec2(0.2, 0.2),
	}

	i++
	objects[i] = ObjectInitData {
		Pos: NewVec2(8, 3),
		Dim: NewVec2(0.2, 3),
	}

	g.setObjects(objects)

	i++
	movingPlatform := ObjectInitData {
		Pos: NewVec2(5, 3),
		Dim: NewVec2(3.0, 0.2),
	}
	g.addObject(i, movingPlatform)
	g.grid.objects[i].update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
		switch prof := (o.Profile).(type) {
		case *Rec2:
			pos := prof.Pos()
			vel := prof.Vel()
			if vel.IsZero() {
				vel.X = 3
			}
			if prof.Pos().X > 10 && vel.X > 0 {
				vel.X = -Abs(vel.X)
			}
			if prof.Pos().X < 4 && vel.X < 0 {
				vel.X = Abs(vel.X)
			}
			pos.Add(vel, ts)
			prof.SetVel(vel)
			prof.SetPos(pos)

			grid.updateObject(o.id, o)
			buffer.objects[o.id] = o.getObjectData()
		default:
			return
		}
	}

	i++
	platform2 := ObjectInitData {
		Pos: NewVec2(10, 4),
		Dim: NewVec2(3.0, 0.2),
	}
	g.addObject(i, platform2)
	g.grid.objects[i].update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
		switch prof := (o.Profile).(type) {
		case *Rec2:
			pos := prof.Pos()
			vel := prof.Vel()
			if vel.IsZero() {
				vel.Y = 3
			}
			if prof.Pos().Y > 7 && vel.Y > 0 {
				vel.Y = -Abs(vel.Y)
			}
			if prof.Pos().Y < 1 && vel.Y < 0 {
				vel.Y = Abs(vel.Y)
			}
			pos.Add(vel, ts)
			prof.SetVel(vel)
			prof.SetPos(pos)

			grid.updateObject(o.id, o)
			buffer.objects[o.id] = o.getObjectData()
		default:
			return
		}
	}


	i++
	platform3 := ObjectInitData {
		Pos: NewVec2(13, 5),
		Dim: NewVec2(3.0, 0.2),
	}
	g.addObject(i, platform3)
	g.grid.objects[i].update = func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
		switch prof := (o.Profile).(type) {
		case *Rec2:
			pos := prof.Pos()
			vel := prof.Vel()
			if vel.IsZero() {
				vel.X = 2
				vel.Y = 2
			}
			if prof.Pos().Y > 10 && vel.Y > 0 {
				vel.X = -Abs(vel.X)
				vel.Y = -Abs(vel.Y)
			}
			if prof.Pos().Y < 5 && vel.Y < 0 {
				vel.X = Abs(vel.X)
				vel.Y = Abs(vel.Y)
			}
			pos.Add(vel, ts)
			prof.SetVel(vel)
			prof.SetPos(pos)

			grid.updateObject(o.id, o)
			buffer.objects[o.id] = o.getObjectData()
		default:
			return
		}
	}
}