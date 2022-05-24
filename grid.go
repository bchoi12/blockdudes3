package main

import (
	"time"
)

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

	lastId map[SpaceType]IdType
	things map[SpacedId]Thing
	thingStates map[SpacedId]*ThingState
	spacedThings map[SpaceType]map[IdType]Thing
	grid map[GridCoord]map[SpacedId]Thing
	reverseGrid map[SpacedId][]GridCoord
}

func NewGrid(unitLength int, unitHeight int) *Grid {
	return &Grid {
		unitLength: unitLength,
		unitHeight: unitHeight,

		lastId: make(map[SpaceType]IdType, 0),
		things: make(map[SpacedId]Thing, 0),
		thingStates: make(map[SpacedId]*ThingState, 0),
		spacedThings: make(map[SpaceType]map[IdType]Thing, 0),
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
	coords := g.getCoords(thing.GetProfile())
	sid := thing.GetSpacedId()

	if _, ok := g.spacedThings[sid.GetSpace()]; !ok {
		g.spacedThings[sid.GetSpace()] = make(map[IdType]Thing, 0)
	}

	// Check for equality
	if g.Has(sid) {
		currentCoords := g.reverseGrid[sid]

		if len(coords) == len(currentCoords) {
			equal := true
			for i := range(coords) {
				if coords[i] != currentCoords[i] {
					equal = false
					break
				}
			}
			if equal {
				return
			}
		}
	} else {
		// Insert since it's missing
		g.insert(sid, thing)
	}

	// Update coords
	g.deleteCoords(sid)
	for _, coord := range(coords) {
		if _, ok := g.grid[coord]; !ok {
			g.grid[coord] = make(map[SpacedId]Thing)
		}
		g.grid[coord][sid] = thing
	}
	g.reverseGrid[sid] = coords
}

func (g *Grid) insert(sid SpacedId, thing Thing) {
	g.things[sid] = thing
	g.thingStates[sid] = NewThingState()
	g.spacedThings[sid.GetSpace()][sid.GetId()] = thing

	if lastId, ok := g.lastId[sid.GetSpace()]; !ok {
		g.lastId[sid.GetSpace()] = sid.GetId()
	} else if sid.GetId() > lastId {
		g.lastId[sid.GetSpace()] = sid.GetId()
	}
}

func (g *Grid) deleteCoords(sid SpacedId) {
	if coords, ok := g.reverseGrid[sid]; ok {
		for _, coord := range(coords) {
			delete(g.grid[coord], sid)
		}
		delete(g.reverseGrid, sid)
	}
}

func (g *Grid) deleteThing(sid SpacedId) {
	g.deleteCoords(sid)
	delete(g.things, sid)
	delete(g.thingStates, sid)
	delete(g.spacedThings[sid.GetSpace()], sid.GetId())
}

func (g *Grid) Update(now time.Time) {
	for _, thing := range(g.GetAllThings()) {
		if thing.GetSpace() == playerSpace {
			continue
		}
		g.updateThing(thing, now)
	}

	// Map iteration is random
	for _, thing := range(g.GetThings(playerSpace)) {
		g.updateThing(thing, now)
	}
}

func (g *Grid) updateThing(thing Thing, now time.Time) {
	updated := thing.UpdateState(g, now)
	if updated {
		// Update location in the grid
		if g.Has(thing.GetSpacedId()) {
			g.Upsert(thing)
		}
	}
}

func (g *Grid) Postprocess(now time.Time) {
	for _, thing := range(g.GetAllThings()) {
		thing.Postprocess(g, now)
	}
}

func (g *Grid) Delete(sid SpacedId) {
	if isWasm {
		g.deleteThing(sid)
		return
	}
	g.thingStates[sid].SetDeleted(true)
}

func (g *Grid) Has(sid SpacedId) bool {
	_, ok := g.things[sid]
	return ok
}

func (g *Grid) Get(sid SpacedId) Thing {
	return g.spacedThings[sid.GetSpace()][sid.GetId()]
}

func (g *Grid) GetLast(space SpaceType) Thing {
	if _, ok := g.lastId[space]; !ok {
		return nil
	}

	return g.spacedThings[space][g.lastId[space]]
}

func (g *Grid) GetInitData() ObjectPropMap {
	objects := make(ObjectPropMap)

	for _, thing := range(g.GetAllThings()) {
		data := thing.GetInitData()
		if data.Size() == 0 {
			continue
		}

		if _, ok := objects[thing.GetSpace()]; !ok {
			objects[thing.GetSpace()] = make(map[IdType]PropMap, 0)
		}
		objects[thing.GetSpace()][thing.GetId()] = data.Props()
	}
	return objects
}

func (g *Grid) GetData() ObjectPropMap {
	objects := make(ObjectPropMap)

	for _, thing := range(g.GetAllThings()) {
		data := thing.GetData()
		if data.Size() == 0 {
			continue
		}

		if _, ok := objects[thing.GetSpace()]; !ok {
			objects[thing.GetSpace()] = make(map[IdType]PropMap, 0)
		}
		objects[thing.GetSpace()][thing.GetId()] = data.Props()
	}
	return objects
}

func (g *Grid) GetUpdates() ObjectPropMap {
	objects := make(ObjectPropMap)

	for _, thing := range(g.GetAllThings()) {
		updates := thing.GetUpdates()
		state := g.thingStates[thing.GetSpacedId()]
		if !state.GetInitialized() {
			updates.Merge(thing.GetInitData())
			state.SetInitialized(true)
		}
		if state.GetDeleted() {
			updates.Set(deletedProp, true)
		}

		if updates.Size() == 0 {
			continue
		}

		if _, ok := objects[thing.GetSpace()]; !ok {
			objects[thing.GetSpace()] = make(map[IdType]PropMap, 0)
		}
		objects[thing.GetSpace()][thing.GetId()] = updates.Props()

		if state.GetDeleted() {
			g.deleteThing(thing.GetSpacedId())
		}
	}
	return objects
}

func (g *Grid) NextId(space SpaceType) IdType {
	id, ok := g.lastId[space]
	if !ok {
		return 0
	}
	return id + 1
}

func (g *Grid) NextSpacedId(space SpaceType) SpacedId {
	return Id(space, g.NextId(space))
}

func (g *Grid) GetAllThings() map[SpacedId]Thing {
	return g.things
}

func (g *Grid) GetThings(space SpaceType) map[IdType]Thing {
	return g.spacedThings[space]
}

func (g *Grid) GetManyThings(spaces ...SpaceType) map[SpaceType]map[IdType]Thing {
	things := make(map[SpaceType]map[IdType]Thing)

	for _, space := range(spaces) {
		things[space] = g.spacedThings[space]
	}
	return things
}

type ColliderOptions struct {
	// TODO: change to set of SpacedId to ignore
	self SpacedId

	hitSpaces map[SpaceType]bool
	hitSolids bool
}
func (g *Grid) GetColliders(prof Profile, options ColliderOptions) ThingHeap {
	heap := make(ThingHeap, 0)

	for sid, thing := range(g.getNearbyThings(prof)) {
		if options.self == sid {
			continue
		}

		evaluate := false
		if len(options.hitSpaces) > 0 {
			if _, ok := options.hitSpaces[sid.GetSpace()]; ok {
				evaluate = true
			}
		} else {
			evaluate = true
		}
		if options.hitSolids && thing.GetProfile().Solid() {
			evaluate = true
		}

		if !evaluate {
			continue
		}

		results := prof.Overlap(thing.GetProfile())
		if results.overlap {
			item := &ThingItem {
				id: sid.GetId(),
				thing: thing,
			}
			heap.Push(item)
			heap.priority(item, results.amount)
		}
	}
	return heap
}

func (g *Grid) GetHits(line Line, options ColliderOptions) *Hit {
	var hit *Hit

	coord := g.getCoord(line.O)
	for {
		closest := 1.0
		for id, thing := range(g.grid[coord]) {
			if id == options.self {
				continue
			}

			results := thing.GetProfile().Intersects(line)
			if !results.hit {
				continue
			}
			point := line.Point(results.t)
			if !coord.contains(g, point) {
				continue
			}

			if results.t < closest {
				hit = NewHit()
				hit.SetTarget(thing.GetSpacedId())
				hit.SetPos(point)

				closest = results.t
			}
		}
		if hit != nil {
			return hit
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

		xresults := line.Intersects(xline)
		yresults := line.Intersects(yline)

		if !xresults.hit && !yresults.hit {
			break
		}
		if xresults.hit && (xresults.t <= yresults.t || !yresults.hit) {
			coord.advance(g, int(Sign(line.R.X)), 0)
			if closest < xresults.t {
				break
			}
		}
		if yresults.hit && (yresults.t <= xresults.t || !xresults.hit) {
			coord.advance(g, 0, int(Sign(line.R.Y)))
			if closest < yresults.t {
				break
			}
		}
	}

	return hit
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
	nearbyThings := make(map[SpacedId]Thing)

	for _, coord := range(g.getCoords(prof)) {
		for id, thing := range(g.grid[coord]) {
			nearbyThings[id] = thing
		}
	}
	return nearbyThings
}