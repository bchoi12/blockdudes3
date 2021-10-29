package main

type GridCoord struct {
	x int
	y int
}

func (gc *GridCoord) advance(grid *Grid, i int, j int) {
	gc.x += i * grid.GetUnitLength()
	gc.y += j * grid.GetUnitHeight()
}

func (gc *GridCoord) contains(grid *Grid, point Vec2) bool {
	return point.X >= float64(gc.x) && point.X < float64(gc.x + grid.GetUnitLength()) && point.Y >= float64(gc.y) && point.Y < float64(gc.y + grid.GetUnitHeight())
}

type Grid struct {
	unitLength int
	unitHeight int

	things map[SpacedId]Thing
	grid map[GridCoord]map[SpacedId]Thing
	reverseGrid map[SpacedId][]GridCoord
}

func NewGrid(unitLength int, unitHeight int) *Grid {
	return &Grid {
		unitLength: unitLength,
		unitHeight: unitHeight,

		things: make(map[SpacedId]Thing, 0),
		grid: make(map[GridCoord]map[SpacedId]Thing, 0),
		reverseGrid: make(map[SpacedId][]GridCoord, 0),
	}
}

func (g *Grid) GetUnitLength() int {
	return g.unitLength
}

func (g *Grid) GetUnitHeight() int {
	return g.unitHeight
}

func (g *Grid) Upsert(thing Thing) {
	sid := thing.GetSpacedId()
	g.Delete(sid)

	coords := g.getCoords(thing.GetProfile())
	for _, coord := range(coords) {
		if _, ok := g.grid[coord]; !ok {
			g.grid[coord] = make(map[SpacedId]Thing)
		}
		g.grid[coord][sid] = thing
	}
	g.reverseGrid[sid] = coords
	g.things[sid] = thing
}

func (g *Grid) Delete(sid SpacedId) {
	if coords, ok := g.reverseGrid[sid]; ok {
		for _, coord := range(coords) {
			delete(g.grid[coord], sid)
		}
		delete(g.reverseGrid, sid)
		delete(g.things, sid)
	}
}

func (g *Grid) Has(sid SpacedId) bool {
	_, ok := g.reverseGrid[sid]
	return ok
}

func (g *Grid) Get(sid SpacedId) Thing {
	return g.things[sid]
}

func (g *Grid) getColliders(prof Profile) ThingHeap {
	heap := make(ThingHeap, 0)

	for sid, thing := range(g.getNearbyThings(prof)) {
		if prof.Overlap(thing.GetProfile()) {
			item := &ThingItem {
				id: sid.id,
				thing: thing,
			}
			heap.Push(item)
			heap.priority(item, prof.OverlapX(thing.GetProfile()) * prof.OverlapY(thing.GetProfile()))
		}
	}
	return heap
}

type LineColliderOptions struct {
	self SpacedId
	ignore map[int]bool
}

func (g *Grid) getLineCollider(line Line, options LineColliderOptions) (bool, *Hit) {
	var collision bool
	hit := &Hit {
		t: 1.0,
	}

	coord := g.getCoord(line.O)
	for {
		for id, thing := range(g.grid[coord]) {
			if id == options.self || options.ignore[id.space] {
				continue
			}

			_, t := thing.GetProfile().Intersects(line)
			if t < hit.t {
				point := line.Point(t)
				collision = coord.contains(g, point)

				if collision {				
					hit.target = thing.GetSpacedId()
					hit.hit = point
					hit.t = t
				}
			}
		}
		if collision {
			return true, hit
		}

		xstart := NewVec2(float64(coord.x), float64(coord.y))
		if Sign(line.R.X) > 0 {
			xstart.X += float64(g.unitLength)
		}
		xline := NewLine(xstart, NewVec2(0, float64(g.unitHeight)))

		ystart := NewVec2(float64(coord.x), float64(coord.y))
		if Sign(line.R.Y) > 0 {
			ystart.Y += float64(g.unitHeight)
		}
		yline := NewLine(ystart, NewVec2(float64(g.unitLength), 0))

		xcollide, xt := line.Intersects(xline)
		ycollide, yt := line.Intersects(yline)

		if !xcollide && !ycollide {
			break
		}
		if xcollide && (xt <= yt || !ycollide) {
			coord.advance(g, int(Sign(line.R.X)), 0)
			if hit.t < xt {
				break
			}
		}
		if ycollide && (yt <= xt || !xcollide) {
			coord.advance(g, 0, int(Sign(line.R.Y)))
			if hit.t < yt {
				break
			}
		}
	}

	return collision, hit
}

func (g* Grid) getCoord(point Vec2) GridCoord {
	cx := IntDown(point.X)
	cy := IntDown(point.Y)

	return GridCoord {
		x: cx - Mod(cx, g.unitLength),
		y: cy - Mod(cy, g.unitHeight),
	}
}

func (g* Grid) getCoords(prof Profile) []GridCoord {
	pos := prof.Pos()
	dim := prof.Dim()

	coords := make([]GridCoord, 0)

	xmin := pos.X - dim.X / 2
	xmax := pos.X + dim.X / 2
	ymin := pos.Y - dim.Y / 2
	ymax := pos.Y + dim.Y / 2

	cxmin := IntDown(xmin) - Mod(IntDown(xmin), g.unitLength)
	cxmax := IntUp(xmax) - Mod(IntUp(xmax), g.unitLength)
	cymin := IntDown(ymin) - Mod(IntDown(ymin), g.unitHeight)
	cymax := IntUp(ymax) - Mod(IntUp(ymax), g.unitHeight)

	for x := cxmin; x <= cxmax; x += g.unitLength {
		for y := cymin; y <= cymax; y += g.unitHeight {
			coords = append(coords, GridCoord{x : x, y: y})
		}
	}
	return coords
}

func (g *Grid) getNearbyThings(prof Profile) map[SpacedId]Thing {
	things := make(map[SpacedId]Thing)

	for _, coord := range(g.getCoords(prof)) {
		for id, thing := range(g.grid[coord]) {
			things[id] = thing
		}
	}
	return things
}