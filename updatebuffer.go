package main

type UpdateBuffer struct {
	rawPlayers map[int]*Player
	rawObjects map[int]*Object
	rawShots []*Shot

	players map[int]PlayerData
	objects map[int]ObjectData
	shots []ShotData
}

func NewUpdateBuffer() *UpdateBuffer {
	return &UpdateBuffer {
		rawPlayers: make(map[int]*Player, 0),
		rawObjects: make(map[int]*Object, 0),
		rawShots: make([]*Shot, 0),

		players: make(map[int]PlayerData, 0),
		objects: make(map[int]ObjectData, 0),
		shots: make([]ShotData, 0),
	}
}

func (ub *UpdateBuffer) process(grid *Grid) {
	for _, shot := range(ub.rawShots) {
		collision, hit := grid.getLineCollider(shot.line, shot.weapon.colliderOptions())
		if collision {
			shot.hits = append(shot.hits, hit)
			shot.line.Scale(hit.t)
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