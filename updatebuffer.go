package main

// TODO: rename this
type UpdateBuffer struct {
	// TODO: this can be slice
	rawThings map[SpacedId]Thing
	rawShots []*Shot

	players PlayerPropMap
	objects ObjectPropMap
	shots ShotPropMaps

	initialized map[SpacedId]bool
	playerUpdates PlayerPropMap
	objectUpdates ObjectPropMap
	gameUpdates PropMap
}

func NewUpdateBuffer() *UpdateBuffer {
	ub := UpdateBuffer {
		initialized: make(map[SpacedId]bool, 0),
	}
	ub.Reset()
	return &ub
}

func (ub *UpdateBuffer) Reset() {
	ub.rawThings = make(map[SpacedId]Thing, 0)
	ub.rawShots = make([]*Shot, 0)

	ub.players = make(PlayerPropMap)
	ub.objects = make(ObjectPropMap)
	ub.shots = make(ShotPropMaps, 0)

	ub.playerUpdates = make(PlayerPropMap)
	ub.objectUpdates = make(ObjectPropMap)
	ub.gameUpdates = make(PropMap)
}

func (ub *UpdateBuffer) Add(thing Thing) {
	ub.rawThings[thing.GetSpacedId()] = thing
}

func (ub *UpdateBuffer) Process(grid *Grid) {
	if !isWasm {
		// TODO: randomize order?
		for _, shot := range(ub.rawShots) {
			shot.Resolve(grid)
			ub.shots = append(ub.shots, shot.GetData().Props())
		}
	}

	for _, thing := range(ub.rawThings) {
		ub.populateData(thing)
		ub.populateUpdates(thing, grid)
	}

	// TODO: game updates
}

func (ub UpdateBuffer) HasUpdates() bool {
	if len(ub.playerUpdates) > 0 {
		return true
	}
	if len(ub.objectUpdates) > 0 {
		return true
	}
	if len(ub.gameUpdates) > 0 {
		return true
	}
	return false
}

func (ub *UpdateBuffer) populateData(thing Thing) {
	data := thing.GetData()
	if data.Size() == 0 {
		return
	}

	sid := thing.GetSpacedId()
	switch thing.(type) {
	case *Player:
		ub.players[sid.GetId()] = data.Props()

	default:
		if _, ok := ub.objects[sid.GetSpace()]; !ok {
			ub.objects[sid.GetSpace()] = make(map[IdType]PropMap, 0)
		}
		ub.objects[sid.GetSpace()][sid.GetId()] = data.Props()
	}
}

func (ub *UpdateBuffer) populateUpdates(thing Thing, grid *Grid) {
	updates := NewData()
	sid := thing.GetSpacedId()

	if _, ok := ub.initialized[sid]; !ok {
		updates.Merge(thing.GetInitData())		
		ub.initialized[sid] = true
	}

	updates.Merge(thing.GetUpdates())
	if !grid.Has(sid) {
		updates.Set(deletedProp, true)	
	}

	if updates.Size() == 0 {
		return
	}

	switch thing.(type) {
	case *Player:
		ub.playerUpdates[sid.GetId()] = updates.Props()

	default:
		if _, ok := ub.objectUpdates[sid.GetSpace()]; !ok {
			ub.objectUpdates[sid.GetSpace()] = make(map[IdType]PropMap, 0)
		}
		ub.objectUpdates[sid.GetSpace()][sid.GetId()] = updates.Props()
	}
}