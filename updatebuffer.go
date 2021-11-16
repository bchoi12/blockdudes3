package main

type UpdateBuffer struct {
	rawPlayers map[IdType]*Player
	rawObjects map[IdType]*Object
	rawShots []*Shot

	players map[IdType]PlayerData
	objects map[IdType]ObjectData
	shots []ShotData
}

func NewUpdateBuffer() *UpdateBuffer {
	return &UpdateBuffer {
		rawPlayers: make(map[IdType]*Player, 0),
		rawObjects: make(map[IdType]*Object, 0),
		rawShots: make([]*Shot, 0),

		players: make(map[IdType]PlayerData, 0),
		objects: make(map[IdType]ObjectData, 0),
		shots: make([]ShotData, 0),
	}
}

func (ub *UpdateBuffer) process(grid *Grid) {
	for _, shot := range(ub.rawShots) {
		collision, hit := grid.getLineCollider(shot.line, shot.weapon.colliderOptions())
		if collision {
			shot.hits = append(shot.hits, hit)
			shot.line.Scale(hit.t)

			if shot.weapon.class == spaceBlast {
				bomb := NewBomb(NewInit(grid.NextSpacedId(objectIdSpace), bombObjectClass, NewVec2(hit.hit.X, hit.hit.Y), NewVec2(1, 1)))
				grid.Upsert(bomb)
			}
		}

		for _, hit := range(shot.hits) {
			switch thing := grid.Get(hit.target).(type) {
			case *Player:
				thing.TakeHit(shot, hit)
			}
		}

		ub.shots = append(ub.shots, shot.getShotData())
	}

	for id, object := range(ub.rawObjects) {
		ub.objects[id] = object.getObjectData()
	}

	for id, player := range(ub.rawPlayers) {
		ub.players[id] = player.getPlayerData()
	}
}