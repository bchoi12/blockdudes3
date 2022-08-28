package main

const (
	unknownLight uint8 = iota
	pointLight
	spotLight
	floorLight
)

type Light struct {
	BaseObject
}

func NewLight(init Init) *Light {
	return &Light {
		BaseObject: NewCircleObject(init),
	}
}