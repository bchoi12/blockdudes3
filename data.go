package main

type Prop uint8
const (
	unknownProp Prop = iota

	// TODO: delete spaceProp
	spaceProp

	dimProp
	solidProp
	collisionTypeProp

	keysProp

	posProp
	velProp
	extVelProp
	accProp
	dirProp

	healthProp

	// debug props
	profileDimProp
	profilePosProp

	// not exported
)

type PropMap map[Prop]interface{}
type ValidProps map[Prop]bool

type Data interface {
	Get(prop Prop) interface{}
	Valid(prop Prop) bool
	Set(prop Prop, data interface{})
	Append(data Data)
	Merge(data Data)
	Has(prop Prop) bool
	Size() int
	FilteredProps(props ...Prop) PropMap
	Props() PropMap
}

type ObjectData struct {
	*BaseData
}

type PlayerData struct {
	*BaseData
}

func NewObjectData() ObjectData {
	return ObjectData{
		BaseData: NewBaseData(),
	}
}

func NewPlayerData() PlayerData {
	return PlayerData{
		BaseData: NewBaseData(),
	}
}

type BaseData struct {
	props PropMap
	validProps ValidProps
}

func NewBaseData() *BaseData {
	return &BaseData {
		props: make(PropMap),
	}
}

func (bd BaseData) Get(prop Prop) interface{} {
	return bd.props[prop]
}

func (bd BaseData) Valid(prop Prop) bool {
	if len(bd.validProps) == 0 {
		return true
	}

	_, ok := bd.validProps[prop]
	return ok
}

func (bd *BaseData) Set(prop Prop, data interface{}) {
	if !bd.Valid(prop) {
		Debug("Error: trying to set invalid prop %d", prop)
		return
	}
	bd.props[prop] = data
}

func (bd *BaseData) Append(otherData Data) {
	for prop, data := range(otherData.Props()) {
		if !bd.Has(prop) {
			bd.Set(prop, data)
		}
	}
}

func (bd *BaseData) Merge(otherData Data) {
	for prop, data := range(otherData.Props()) {
		bd.Set(prop, data)
	}
}

func (bd BaseData) Has(prop Prop) bool {
	_, ok := bd.props[prop]
	return ok
}

func (bd BaseData) Size() int {
	return len(bd.props)
}

func (bd BaseData) Props() PropMap {
	return bd.props
}

func (bd BaseData) FilteredProps(props ...Prop) PropMap {
	filtered := make(PropMap)
	
	for _, prop := range(props) {
		if bd.Has(prop) {
			filtered[prop] = bd.Get(prop)
		}
	}
	return filtered
}