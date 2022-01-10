package main

type UpdateBuffer struct {
	rawThings map[SpacedId]Thing
	rawShots []*Shot

	players map[IdType]PropMap
	objects map[SpaceType]map[IdType]PropMap
	shots []ShotData
}

func NewUpdateBuffer() *UpdateBuffer {
	return &UpdateBuffer {
		rawThings: make(map[SpacedId]Thing, 0),
		rawShots: make([]*Shot, 0),

		players: make(map[IdType]PropMap, 0),
		objects: make(map[SpaceType]map[IdType]PropMap, 0),
		shots: make([]ShotData, 0),
	}
}

func (ub *UpdateBuffer) process(grid *Grid) {
	if !isWasm {
		for _, shot := range(ub.rawShots) {
			shot.Resolve(grid)
			ub.shots = append(ub.shots, shot.getShotData())
		}
	}

	for sid, t := range(ub.rawThings) {
		switch thing := t.(type) {
		case *Player:
			ub.players[sid.id] = thing.GetData().Props()
		default:
			if _, ok := ub.objects[sid.space]; !ok {
				ub.objects[sid.space] = make(map[IdType]PropMap, 0)
			}
			ub.objects[sid.space][sid.id] = thing.GetData().Props()
		}
	}
}