package main

type Prop uint8
const (
	unknownProp Prop = iota

	spaceProp
	dimProp

	posProp
	velProp
	extVelProp
	accProp
	dirProp

	healthProp
)

type PropMap map[Prop]interface{}
type ObjectData struct {
	props PropMap
}

func NewObjectData() ObjectData {
	return ObjectData{
		props: make(PropMap, 0),
	}
}

func (od *ObjectData) Get(prop Prop) interface{} {
	return od.props[prop]
}

func (od *ObjectData) Set(prop Prop, data interface{}) {
	// TODO: error checking
	od.props[prop] = data
}

func (od ObjectData) Has(prop Prop) bool {
	_, ok := od.props[prop]
	return ok
}

func (od ObjectData) Size() int {
	return len(od.props)
}

func (od ObjectData) Props() PropMap {
	return od.props
}