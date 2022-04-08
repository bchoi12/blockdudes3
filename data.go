package main

type Prop uint8
const (
	unknownProp Prop = iota

	deletedProp
	dimProp
	keysProp
	posProp
	endPosProp

	velProp
	extVelProp
	accProp
	dirProp
	healthProp

	solidProp
	groundedProp
	hitsProp
	weaponDirProp

	// debug props
	profileDimProp
	profilePosProp
	profilePointsProp

	// not exported
)

type PropMap map[Prop]interface{}
type ValidProps map[Prop]bool

type Data struct {
	props PropMap
	validProps ValidProps
}

func NewData() Data {
	return Data {
		props: make(PropMap),
	}
}

func (d Data) Get(prop Prop) interface{} {
	return d.props[prop]
}

func (d Data) Valid(prop Prop) bool {
	if len(d.validProps) == 0 {
		return true
	}

	_, ok := d.validProps[prop]
	return ok
}

func (d *Data) Set(prop Prop, data interface{}) {
	if !d.Valid(prop) {
		Debug("Error: trying to set invalid prop %d", prop)
		return
	}
	d.props[prop] = data
}

func (d *Data) Append(other Data) {
	for prop, data := range(other.Props()) {
		if !d.Has(prop) {
			d.Set(prop, data)
		}
	}
}

func (d *Data) Merge(other Data) {
	for prop, data := range(other.Props()) {
		d.Set(prop, data)
	}
}

func (d Data) Has(prop Prop) bool {
	_, ok := d.props[prop]
	return ok
}

func (d Data) Size() int {
	return len(d.props)
}

func (d Data) Props() PropMap {
	return d.props
}

func (d Data) FilteredProps(props ...Prop) PropMap {
	filtered := make(PropMap)
	
	for _, prop := range(props) {
		if d.Has(prop) {
			filtered[prop] = d.Get(prop)
		}
	}
	return filtered
}