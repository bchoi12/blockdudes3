package main

import (
	"math"
)

const (
	gridUnitLength int = 4
	gridUnitHeight int = 4
)

type GridCoord struct {
	x int
	y int
}

type Grid struct {
	grid map[GridCoord]map[int]*Object
	reverseGrid map[int][]GridCoord
}

func newGrid() *Grid {
	return &Grid {
		grid: make(map[GridCoord]map[int]*Object, 0),
		reverseGrid: make(map[int][]GridCoord, 0),
	}
}

func (g* Grid) updateObject(id int, object *Object) {
	if coords, ok := g.reverseGrid[id]; ok {
		for _, coord := range(coords) {
			delete(g.grid[coord], id)
		}
		delete(g.reverseGrid, id)
	}

	coords := g.getCoords(object.Profile)
	for _, coord := range(coords) {
		if _, ok := g.grid[coord]; !ok {
			g.grid[coord] = make(map[int]*Object)
		}
		g.grid[coord][id] = object
	}
	g.reverseGrid[id] = coords
}

func (g* Grid) setObjects(objects map[int]*Object) {
	for id, object := range(objects) {
		g.updateObject(id, object)
	}
}

func (g* Grid) getCoords(prof Profile) []GridCoord {
	pos := prof.Pos()
	dim := prof.Dim()

	coords := make([]GridCoord, 0)

	xmin := int(math.Floor(pos.X - dim.X / 2))
	xmax := int(math.Ceil(pos.X + dim.X / 2))
	ymin := int(math.Floor(pos.Y - dim.Y / 2))
	ymax := int(math.Ceil(pos.Y + dim.Y / 2)) 

	cxmin := xmin - xmin % gridUnitLength
	cxmax := xmax - xmax % gridUnitLength
	cymin := ymin - ymin % gridUnitHeight
	cymax := ymax - ymax % gridUnitHeight

	for x := cxmin; x <= cxmax; x += gridUnitLength {
		for y := cymin; y <= cymax; y += gridUnitHeight {
			coords = append(coords, GridCoord{x : x, y: y})
		}
	}
	return coords
}

func (g *Grid) getNearbyObjects(prof Profile) map[int]*Object {
	objects := make(map[int]*Object)

	for _, coord := range(g.getCoords(prof)) {
		for id, object := range(g.grid[coord]) {
			objects[id] = object
		}
	}
	return objects
}

func (g *Grid) getPrimaryCollider(prof Profile) (int, *Object) {
	var colliderId int
	var collider *Object
	maxOverlap := 0.0

	for id, object := range(g.getNearbyObjects(prof)) {
		if prof.Overlap(object.Profile) {
			overlap := prof.OverlapX(object.Profile) * prof.OverlapY(object.Profile)

			if overlap > maxOverlap {
				colliderId = id
				collider = object
				maxOverlap = overlap
			}
		}
	}

	return colliderId, collider
}

func (g *Grid) getColliders(prof Profile) ObjectHeap {
	objectHeap := make(ObjectHeap, 0)

	for id, object := range(g.getNearbyObjects(prof)) {
		if prof.Overlap(object.Profile) {
			item := &ObjectItem {
				id: id,
				object: object,
			}
			objectHeap.Push(item)
			objectHeap.priority(item, prof.OverlapX(object.Profile) * prof.OverlapY(object.Profile))
		}
	}
	return objectHeap
}