package main

type UpdateBuffer struct {
	players map[int]PlayerData
	shots []ShotData
}

func NewUpdateBuffer() *UpdateBuffer {
	return &UpdateBuffer {
		players: make(map[int]PlayerData, 0),
		shots: make([]ShotData, 0),
	}
}