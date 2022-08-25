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

func (g *Grid) New(init Init) Object {
	switch init.GetSpace() {
	case playerSpace:
		return NewPlayer(init)
	case blockSpace:
		return NewBlock(init)
	case wallSpace:
		return NewWall(init)
	case weaponSpace:
		return NewWeapon(init)
	case bombSpace:
		return NewBomb(init)
	case pelletSpace:
		return NewPellet(init)
	case boltSpace:
		return NewBolt(init)
	case rocketSpace:
		return NewRocket(init)
	case starSpace:
		return NewStar(init)
	case grapplingHookSpace:
		return NewGrapplingHook(init)
	case explosionSpace:
		return NewExplosion(init)
	case pickupSpace:
		return NewPickup(init)
	default:
		Debug("Unknown space! %+v", init)
		return nil
	}
}

func (g *Grid) Upsert(object Object) {
	coords := g.getCoords(object)
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
	if sid.Invalid() {
		Debug("Invalid ID: %+v", sid)
		return
	}

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
	if object, ok := g.objects[sid]; ok {
		object.OnDelete(g)
	}
	g.deleteCoords(sid)
	delete(g.objects, sid)

	if _, ok := g.spacedObjects[sid.GetSpace()]; ok {
		delete(g.spacedObjects[sid.GetSpace()], sid.GetId())
	}
}

func (g *Grid) Update(now time.Time) {
	for _, object := range(g.GetAllObjects()) {
		object.Preprocess(g, now)
	}

	for _, object := range(g.GetAllObjects()) {
		if object.GetSpace() == playerSpace {
			continue
		}
		object.UpdateState(g, now)
	}

	// Map iteration is random
	for _, object := range(g.GetObjects(playerSpace)) {
		object.UpdateState(g, now)
	}
}

func (g *Grid) updateObject(object Object, now time.Time) {
	object.UpdateState(g, now)
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
	if sid.Invalid() {
		return false
	}

	_, ok := g.objects[sid]
	return ok
}

func (g *Grid) Get(sid SpacedId) Object {
	if sid.Invalid() {
		return nil
	}

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

	for space, spacedPropMap := range(g.gameState.GetObjectInitProps()) {
		if _, ok := objects[space]; !ok {
			objects[space] = make(SpacedPropMap)
		}
		for id, propMap := range(spacedPropMap) {
			if _, ok := objects[space][id]; !ok {
				objects[space][id] = propMap
				continue
			}

			for prop, data := range(propMap) {
				objects[space][id][prop] = data
			}
		}
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

	for space, spacedPropMap := range(g.gameState.GetObjectPropUpdates()) {
		if _, ok := objects[space]; !ok {
			objects[space] = make(SpacedPropMap)
		}
		for id, propMap := range(spacedPropMap) {
			if _, ok := objects[space][id]; !ok {
				objects[space][id] = propMap
				continue
			}

			for prop, data := range(propMap) {
				objects[space][id][prop] = data
			}
		}
	}

	return objects
}

func (g *Grid) IncrementScore(sid SpacedId, prop Prop, delta int) {
	if sid.Invalid() {
		return
	}
	
	g.gameState.IncrementScore(sid, prop, delta)
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

func (g *Grid) GetColliders(object Object) ObjectHeap {
	heap := make(ObjectHeap, 0)

	for _, other := range(g.getNearbyObjects(object)) {
		results := object.OverlapProfile(other.GetProfile())
		if results.hit {
			item := &ObjectItem {
				object: other,
			}
			heap.Push(item)
			heap.priority(item, results.GetPosAdjustment().Area())
		}
	}
	return heap
}

func (g* Grid) getCoord(point Vec2) GridCoord {
	cx := IntDown(point.X)
	cy := IntDown(point.Y)

	return GridCoord {
		x: cx - Mod(cx, g.unitLength),
		y: cy - Mod(cy, g.unitHeight),
	}
}

func (g* Grid) getCoords(object Object) []GridCoord {
	pos := object.Pos()
	dim := object.Dim()

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

func (g *Grid) getNearbyObjects(object Object) map[SpacedId]Object {
	nearbyObjects := make(map[SpacedId]Object)

	for _, coord := range(g.getCoords(object)) {
		for sid, other := range(g.grid[coord]) {
			if sid == object.GetSpacedId() {
				continue
			}
			if !object.GetOverlapOptions().Evaluate(other) && !object.GetSnapOptions().Evaluate(other) {
				continue
			}
			nearbyObjects[sid] = other
		}
	}
	return nearbyObjects
}