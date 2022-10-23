package main

type AttributeType uint8
const (
	unknownAttribute AttributeType = iota

	initializedAttribute
	autoRespawnAttribute
	deletedAttribute
	attachedAttribute
	chargingAttribute
	chargedAttribute
	canJumpAttribute
	canDoubleJumpAttribute
	dashingAttribute
	deadAttribute
	visibleAttribute
	vipAttribute
	fromLevelAttribute
)

type ByteAttributeType uint8
const (
	unknownByteAttribute ByteAttributeType = iota

	typeByteAttribute
	subtypeByteAttribute
	stateByteAttribute
	teamByteAttribute
	openingByteAttribute

	// TODO: not really attributes?
	healthByteAttribute
	juiceByteAttribute
)

type IntAttributeType uint8
const (
	unknownIntAttribute IntAttributeType = iota
	colorIntAttribute
	secondaryColorIntAttribute

	killIntAttribute
	deathIntAttribute
)

type FloatAttributeType uint8
const (
	unknownFloatAttributeType = iota
	posZFloatAttribute
	dimZFloatAttribute
	intensityFloatAttribute
	distanceFloatAttribute
	fovFloatAttribute
)

var wasmIgnoreAttributes = map[AttributeType]bool {
	canJumpAttribute: true,
	deadAttribute: true,
}

var wasmIgnoreByteAttributes = map[ByteAttributeType]bool {
	healthByteAttribute: true,
}

var wasmIgnoreIntAttributes = map[IntAttributeType]bool {
}

var wasmIgnoreFloatAttributes = map[FloatAttributeType]bool {
}

type Attribute struct {
	changed map[AttributeType]*Flag
	attributes map[AttributeType]bool
	internalAttributes map[AttributeType]bool

	byteChanged map[ByteAttributeType]*Flag
	byteAttributes map[ByteAttributeType]uint8

	intChanged map[IntAttributeType]*Flag
	intAttributes map[IntAttributeType]int

	floatChanged map[FloatAttributeType]*Flag
	floatAttributes map[FloatAttributeType]float64
}

func NewAttribute() Attribute {
	return Attribute {
		changed: make(map[AttributeType]*Flag),
		attributes: make(map[AttributeType]bool),
		internalAttributes: make(map[AttributeType]bool),

		byteChanged: make(map[ByteAttributeType]*Flag),
		byteAttributes: make(map[ByteAttributeType]uint8),

		intChanged: make(map[IntAttributeType]*Flag),
		intAttributes: make(map[IntAttributeType]int),

		floatChanged: make(map[FloatAttributeType]*Flag),
		floatAttributes: make(map[FloatAttributeType]float64),
	}
}

func (a *Attribute) AddAttribute(attribute AttributeType) {
	if a.HasAttribute(attribute) {
		return
	}

	if _, ok := a.changed[attribute]; !ok {
		a.changed[attribute] = NewFlag()
	}

	a.changed[attribute].Reset(true)
	a.attributes[attribute] = true
}

func (a *Attribute) AddInternalAttribute(attribute AttributeType) {
	if a.HasAttribute(attribute) {
		return
	}

	a.internalAttributes[attribute] = true
}

func (a *Attribute) SetByteAttribute(attribute ByteAttributeType, byte uint8) {
	if value, ok := a.byteAttributes[attribute]; ok && value == byte {
		return
	}

	if _, ok := a.byteChanged[attribute]; !ok {
		a.byteChanged[attribute] = NewFlag()
	}

	a.byteChanged[attribute].Reset(true)
	a.byteAttributes[attribute] = byte
}

func (a *Attribute) SetIntAttribute(attribute IntAttributeType, int int) {
	if value, ok := a.intAttributes[attribute]; ok && value == int {
		return
	}

	if _, ok := a.intChanged[attribute]; !ok {
		a.intChanged[attribute] = NewFlag()
	}

	a.intChanged[attribute].Reset(true)
	a.intAttributes[attribute] = int
}

func (a *Attribute) SetFloatAttribute(attribute FloatAttributeType, float float64) {
	if value, ok := a.floatAttributes[attribute]; ok && value == float {
		return
	}

	if _, ok := a.floatChanged[attribute]; !ok {
		a.floatChanged[attribute] = NewFlag()
	}

	a.floatChanged[attribute].Reset(true)
	a.floatAttributes[attribute] = float
}

func (a *Attribute) RemoveAttribute(attribute AttributeType) {
	if has, ok := a.attributes[attribute]; ok && has {
		if _, ok := a.changed[attribute]; !ok {
			a.changed[attribute] = NewFlag()
		}
		
		a.changed[attribute].Reset(true)
		a.attributes[attribute] = false
	}

	if has, ok := a.internalAttributes[attribute]; ok && has {
		a.internalAttributes[attribute] = false
	}
}

func (a Attribute) HasAttribute(attribute AttributeType) bool {
	has, ok := a.attributes[attribute]
	hasInternal, okInternal := a.internalAttributes[attribute]
	return (ok && has) || (hasInternal && okInternal) 
}

func (a Attribute) GetByteAttribute(attribute ByteAttributeType) (uint8, bool) {
	byte, ok := a.byteAttributes[attribute]
	return byte, ok
}

func (a Attribute) GetIntAttribute(attribute IntAttributeType) (int, bool) {
	int, ok := a.intAttributes[attribute]
	return int, ok
}

func (a Attribute) GetFloatAttribute(attribute FloatAttributeType) (float64, bool) {
	float, ok := a.floatAttributes[attribute]
	return float, ok
}

func (a Attribute) GetInitData() Data {
	data := NewData()

	if len(a.attributes) > 0 {
		data.Set(attributesProp, a.attributes)
	}
	if len(a.byteAttributes) > 0 {
		data.Set(byteAttributesProp, a.byteAttributes)
	}
	if len(a.intAttributes) > 0 {
		data.Set(intAttributesProp, a.intAttributes)
	}
	if len(a.floatAttributes) > 0 {
		data.Set(floatAttributesProp, a.floatAttributes)
	}
	return data
}

func (a Attribute) GetData() Data {
	data := NewData()
	newAttributes := make(map[AttributeType]bool)
	for attribute, flag := range(a.changed) {
		if isWasm && wasmIgnoreAttributes[attribute] {
			continue
		}

		if _, ok := flag.Pop(); ok {
			newAttributes[attribute] = a.attributes[attribute]
		}
	}

	newByteAttributes := make(map[ByteAttributeType]uint8)
	for attribute, flag := range(a.byteChanged) {
		if isWasm && wasmIgnoreByteAttributes[attribute] {
			continue
		}

		if _, ok := flag.Pop(); ok {
			newByteAttributes[attribute] = a.byteAttributes[attribute]
		}
	}

	newIntAttributes := make(map[IntAttributeType]int)
	for attribute, flag := range(a.intChanged) {
		if isWasm && wasmIgnoreIntAttributes[attribute] {
			continue
		}

		if _, ok := flag.Pop(); ok {
			newIntAttributes[attribute] = a.intAttributes[attribute]
		}
	}	

	newFloatAttributes := make(map[FloatAttributeType]float64)
	for attribute, flag := range(a.floatChanged) {
		if isWasm && wasmIgnoreFloatAttributes[attribute] {
			continue
		}

		if _, ok := flag.Pop(); ok {
			newFloatAttributes[attribute] = a.floatAttributes[attribute]
		}
	}	


	if len(newAttributes) > 0 {
		data.Set(attributesProp, newAttributes)
	}
	if len(newByteAttributes) > 0 {
		data.Set(byteAttributesProp, newByteAttributes)
	}
	if len(newIntAttributes) > 0 {
		data.Set(intAttributesProp, newIntAttributes)
	}
	if len(newFloatAttributes) > 0 {
		data.Set(floatAttributesProp, newFloatAttributes)
	}

	return data
}

func (a Attribute) GetUpdates() Data {
	updates := NewData()

	newAttributes := make(map[AttributeType]bool)
	for attribute, flag := range(a.changed) {
		if isWasm && wasmIgnoreAttributes[attribute] {
			continue
		}

		if _, ok := flag.GetOnce(); ok {
			newAttributes[attribute] = a.attributes[attribute]
		}
	}

	newByteAttributes := make(map[ByteAttributeType]uint8)
	for attribute, flag := range(a.byteChanged) {
		if isWasm && wasmIgnoreByteAttributes[attribute] {
			continue
		}

		if _, ok := flag.GetOnce(); ok {
			newByteAttributes[attribute] = a.byteAttributes[attribute]
		}
	}

	newIntAttributes := make(map[IntAttributeType]int)
	for attribute, flag := range(a.intChanged) {
		if isWasm && wasmIgnoreIntAttributes[attribute] {
			continue
		}

		if _, ok := flag.GetOnce(); ok {
			newIntAttributes[attribute] = a.intAttributes[attribute]
		}
	}

	newFloatAttributes := make(map[FloatAttributeType]float64)
	for attribute, flag := range(a.floatChanged) {
		if isWasm && wasmIgnoreFloatAttributes[attribute] {
			continue
		}

		if _, ok := flag.GetOnce(); ok {
			newFloatAttributes[attribute] = a.floatAttributes[attribute]
		}
	}

	if len(newAttributes) > 0 {
		updates.Set(attributesProp, newAttributes)
	}
	if len(newByteAttributes) > 0 {
		updates.Set(byteAttributesProp, newByteAttributes)
	}
	if len(newIntAttributes) > 0 {
		updates.Set(intAttributesProp, newIntAttributes)
	}
	if len(newFloatAttributes) > 0 {
		updates.Set(floatAttributesProp, newFloatAttributes)
	}

	return updates
}

func (a *Attribute) SetData(data Data) {
	if data.Has(attributesProp) {
		newAttributes := data.Get(attributesProp).(map[AttributeType]bool)

		for attribute, val := range(newAttributes) {
			a.attributes[attribute] = val
		}
	}

	if data.Has(byteAttributesProp) {
		newByteAttributes := data.Get(byteAttributesProp).(map[ByteAttributeType]uint8)
		for byteAttribute, val := range(newByteAttributes) {
			a.byteAttributes[byteAttribute] = val
		}
	}

	if data.Has(intAttributesProp) {
		newIntAttributes := data.Get(intAttributesProp).(map[IntAttributeType]int)
		for intAttribute, val := range(newIntAttributes) {
			a.intAttributes[intAttribute] = val
		}
	}

	if data.Has(floatAttributesProp) {
		newFloatAttributes := data.Get(floatAttributesProp).(map[FloatAttributeType]float64)
		for floatAttribute, val := range(newFloatAttributes) {
			a.floatAttributes[floatAttribute] = val
		}
	}
}