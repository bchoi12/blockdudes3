package main

type UpdateBuffer struct {
	players map[int]PlayerData
	objects map[int]ObjectData
	shots []ShotData
}

func NewUpdateBuffer() *UpdateBuffer {
	return &UpdateBuffer {
		players: make(map[int]PlayerData, 0),
		objects: make(map[int]ObjectData, 0),
		shots: make([]ShotData, 0),
	}
}