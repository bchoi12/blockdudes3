package main

type UpdateBuffer struct {
	rawThings map[SpacedId]Thing
	rawShots []*Shot

	players PlayerPropMap
	objects ObjectPropMap
	shots ShotPropMaps
}

func NewUpdateBuffer() *UpdateBuffer {
	return &UpdateBuffer {
		rawThings: make(map[SpacedId]Thing, 0),
		rawShots: make([]*Shot, 0),

		players: make(PlayerPropMap),
		objects: make(ObjectPropMap),
		shots: make(ShotPropMaps, 0),
	}
}

func (ub *UpdateBuffer) process(grid *Grid) {
	if !isWasm {
		for _, shot := range(ub.rawShots) {
			shot.Resolve(grid)
			ub.shots = append(ub.shots, shot.GetData().Props())
		}
	}

	for sid, t := range(ub.rawThings) {
		switch thing := t.(type) {
		case *Player:
			ub.players[sid.GetId()] = thing.GetData().Props()
		default:
			if _, ok := ub.objects[sid.GetSpace()]; !ok {
				ub.objects[sid.GetSpace()] = make(map[IdType]PropMap, 0)
			}
			ub.objects[sid.GetSpace()][sid.GetId()] = thing.GetData().Props()
		}
	}
}