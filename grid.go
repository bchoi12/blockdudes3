package main

import (
	"time"
)

const (
	
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

	gameState GameState

	lastId map[SpaceType]IdType
	objects map[SpacedId]Object
	spacedObjects map[SpaceType]map[IdType]Object

	grid map[GridCoord]map[SpacedId]Object
	reverseGrid map[SpacedId][]GridCoord
}

func NewGrid(unitLength int, unitHeight int) *Grid {
	return &Grid {
		unitLength: unitLength,
		unitHeight: unitHeight,

		gameState: NewGameState(),

		lastId: make(map[SpaceType]IdType, 0),
		objects: make(map[SpacedId]Object, 0),
		spacedObjects: make(map[SpaceType]map[IdType]Object, 0),
		grid: make(map[GridCoord]map[SpacedId]Object, 0),
		reverseGrid: make(map[SpacedId][]GridCoord, 0),
	}
}

func (g *Grid) GetUnitLength() int {
	return g.unitLength
}

func (g *Grid) GetUnitHeight() int {
	return g.unitHeight
}

func (g *Grid) Upsert(object Object) {
	coords := g.getCoords(object.GetProfile())
	sid := object.GetSpacedId()

	if _, ok := g.spacedObjects[sid.GetSpace()]; !ok {
		g.spacedObjects[sid.GetSpace()] = make(map[IdType]Object, 0)
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
		g.insert(sid, object)
	}

	// Update coords
	g.deleteCoords(sid)
	for _, coord := range(coords) {
		if _, ok := g.grid[coord]; !ok {
			g.grid[coord] = make(map[SpacedId]Object)
		}
		g.grid[coord][sid] = object
	}
	g.reverseGrid[sid] = coords
}

func (g *Grid) insert(sid SpacedId, object Object) {
	g.objects[sid] = object
	g.gameState.RegisterId(sid)
	g.spacedObjects[sid.GetSpace()][sid.GetId()] = object

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

func (g *Grid) deleteObject(sid SpacedId) {
	g.deleteCoords(sid)
	delete(g.objects, sid)
	delete(g.spacedObjects[sid.GetSpace()], sid.GetId())
}

func (g *Grid) Update(now time.Time) {
	for _, object := range(g.GetAllObjects()) {
		if object.GetSpace() == playerSpace {
			continue
		}
		g.updateObject(object, now)
	}

	// Map iteration is random
	for _, object := range(g.GetObjects(playerSpace)) {
		g.updateObject(object, now)
	}
}

func (g *Grid) updateObject(object Object, now time.Time) {
	updated := object.UpdateState(g, now)
	if updated {
		// Update location in the grid
		if g.Has(object.GetSpacedId()) {
			g.Upsert(object)
		}
	}
}

func (g *Grid) Postprocess(now time.Time) {
	for _, object := range(g.GetAllObjects()) {
		object.Postprocess(g, now)
	}
}

func (g *Grid) Delete(sid SpacedId) {
	if isWasm {
		g.deleteObject(sid)
		return
	}
	g.gameState.SetObjectState(sid, deletedProp, true)
}

func (g *Grid) Has(sid SpacedId) bool {
	_, ok := g.objects[sid]
	return ok
}

func (g *Grid) Get(sid SpacedId) Object {
	if _, ok := g.spacedObjects[sid.GetSpace()]; !ok {
		return nil
	}
	return g.spacedObjects[sid.GetSpace()][sid.GetId()]
}

func (g *Grid) GetLast(space SpaceType) Object {
	if _, ok := g.lastId[space]; !ok {
		return nil
	}

	return g.spacedObjects[space][g.lastId[space]]
}

func (g *Grid) GetObjectInitData() ObjectPropMap {
	objects := make(ObjectPropMap)

	for _, object := range(g.GetAllObjects()) {
		data := object.GetInitData()
		if data.Size() == 0 {
			continue
		}

		if _, ok := objects[object.GetSpace()]; !ok {
			objects[object.GetSpace()] = make(map[IdType]PropMap, 0)
		}
		objects[object.GetSpace()][object.GetId()] = data.Props()
	}
	return objects
}

func (g *Grid) GetObjectData() ObjectPropMap {
	objects := make(ObjectPropMap)

	for _, object := range(g.GetAllObjects()) {
		data := object.GetData()
		if data.Size() == 0 {
			continue
		}

		if _, ok := objects[object.GetSpace()]; !ok {
			objects[object.GetSpace()] = make(map[IdType]PropMap, 0)
		}
		objects[object.GetSpace()][object.GetId()] = data.Props()
	}
	return objects
}

func (g *Grid) GetObjectUpdates() ObjectPropMap {
	objects := make(ObjectPropMap)

	for sid, object := range(g.GetAllObjects()) {
		updates := object.GetUpdates()
		if !g.gameState.GetObjectState(sid, initializedProp).Peek().(bool) {
			updates.Merge(object.GetInitData())
			g.gameState.SetObjectState(sid, initializedProp, true)
		}
		deleted := g.gameState.GetObjectState(sid, deletedProp).Peek().(bool)
		if deleted {
			updates.Set(deletedProp, true)
		}

		if updates.Size() == 0 {
			continue
		}

		if _, ok := objects[object.GetSpace()]; !ok {
			objects[object.GetSpace()] = make(SpacedPropMap, 0)
		}
		objects[object.GetSpace()][object.GetId()] = updates.Props()

		if deleted {
			g.deleteObject(object.GetSpacedId())
		}
	}
	return objects
}

func (g *Grid) IncrementScore(sid SpacedId, prop Prop, delta int) {
	g.gameState.IncrementScore(sid, prop, delta)
}

// TODO: just combine this with updates
func (g *Grid) GetGameUpdates() PropMap {
	return g.gameState.GetUpdates().Props()
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

func (g *Grid) GetAllObjects() map[SpacedId]Object {
	return g.objects
}

func (g *Grid) GetObjects(space SpaceType) map[IdType]Object {
	return g.spacedObjects[space]
}

func (g *Grid) GetManyObjects(spaces ...SpaceType) map[SpaceType]map[IdType]Object {
	objects := make(map[SpaceType]map[IdType]Object)

	for _, space := range(spaces) {
		objects[space] = g.spacedObjects[space]
	}
	return objects
}

type ColliderOptions struct {
	// TODO: change to set of SpacedId to ignore
	self SpacedId

	hitSpaces map[SpaceType]bool
	hitSolids bool
}
func (g *Grid) GetColliders(prof Profile, options ColliderOptions) ObjectHeap {
	heap := make(ObjectHeap, 0)

	for sid, object := range(g.getNearbyObjects(prof)) {
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
		if options.hitSolids && object.GetProfile().Solid() {
			evaluate = true
		}

		if !evaluate {
			continue
		}

		results := prof.Overlap(object.GetProfile())
		if results.overlap {
			item := &ObjectItem {
				id: sid.GetId(),
				object: object,
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
		for id, object := range(g.grid[coord]) {
			if id == options.self {
				continue
			}

			results := object.GetProfile().Intersects(line)
			if !results.hit {
				continue
			}
			point := line.Point(results.t)
			if !coord.contains(g, point) {
				continue
			}

			if results.t < closest {
				hit = NewHit()
				hit.SetTarget(object.GetSpacedId())
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

func (g *Grid) getNearbyObjects(prof Profile) map[SpacedId]Object {
	nearbyObjects := make(map[SpacedId]Object)

	for _, coord := range(g.getCoords(prof)) {
		for id, object := range(g.grid[coord]) {
			nearbyObjects[id] = object
		}
	}
	return nearbyObjects
}