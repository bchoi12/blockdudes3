package main

type Score struct {
	kill int
	death int
}

type ScoreBoard struct {
	updates map[SpacedId]Score
	scores map[SpacedId]Score
}

func NewScoreBoard() ScoreBoard {
	return ScoreBoard {
		updates: make(map[SpacedId]Score),
		scores: make(map[SpacedId]Score),
	}
}

func (sb *ScoreBoard) SetScore(sid SpacedId, k int, d int) {

}

func (sb *ScoreBoard) IncrementScore(sid SpacedId, k int, d int) {

}

func (sb *ScoreBoard) GetInitData() Data {
	data := NewData()
	
	return data
}

func (sb *ScoreBoard) GetUpdates() Data {
	updates := NewData()
	return updates
}