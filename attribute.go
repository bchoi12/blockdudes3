package main

type AttributeType uint8
const (
	unknownAttribute AttributeType = iota

	solidAttribute
	stairAttribute
	platformAttribute

	attachedAttribute
	chargingAttribute
	chargedAttribute
	groundedAttribute
	deadAttribute
)

type ByteAttributeType uint8
const (
	unknownByteAttribute ByteAttributeType = iota

	typeByteAttribute

	// TODO: not really attributes?
	healthByteAttribute
	juiceByteAttribute
)

type IntAttributeType uint8
const (
	unknownIntAttribute IntAttributeType = iota
	colorIntAttribute
)

type FloatAttributeType uint8
const (
	unknownFloatAttributeType = iota
	posZFloatAttribute
	dimZFloatAttribute
)

var wasmIgnoreAttributes = map[AttributeType]bool {
	groundedAttribute: true,
	deadAttribute: true,
}

var wasmIgnoreByteAttributes = map[ByteAttributeType]bool {
	healthByteAttribute: true,
}

type Attribute struct {
	changed map[AttributeType]*Flag
	attributes map[AttributeType]bool

	byteChanged map[ByteAttributeType]*Flag
	byteAttributes map[ByteAttributeType]uint8
}

func NewAttribute() Attribute {
	return Attribute {
		changed: make(map[AttributeType]*Flag),
		attributes: make(map[AttributeType]bool),

		byteChanged: make(map[ByteAttributeType]*Flag),
		byteAttributes: make(map[ByteAttributeType]uint8),
	}
}

func (a *Attribute) AddAttribute(attribute AttributeType) {
	if has, ok := a.attributes[attribute]; ok && has {
		return
	}

	if _, ok := a.changed[attribute]; !ok {
		a.changed[attribute] = NewFlag()
	}

	a.changed[attribute].Reset(true)
	a.attributes[attribute] = true
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

func (a *Attribute) RemoveAttribute(attribute AttributeType) {
	if has, ok := a.attributes[attribute]; ok && !has {
		return
	}

	if _, ok := a.changed[attribute]; !ok {
		a.changed[attribute] = NewFlag()
	}
	
	a.changed[attribute].Reset(true)
	a.attributes[attribute] = false
}

func (a Attribute) HasAttribute(attribute AttributeType) bool {
	has, ok := a.attributes[attribute]
	return ok && has 
}

func (a Attribute) GetByteAttribute(attribute ByteAttributeType) (uint8, bool) {
	byte, ok := a.byteAttributes[attribute]
	return byte, ok
}

func (a Attribute) GetInitData() Data {
	data := NewData()

	if len(a.attributes) > 0 {
		data.Set(attributesProp, a.attributes)
	}
	if len(a.byteAttributes) > 0 {
		data.Set(byteAttributesProp, a.byteAttributes)
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

	if len(newAttributes) > 0 {
		data.Set(attributesProp, newAttributes)
	}
	if len(newByteAttributes) > 0 {
		data.Set(byteAttributesProp, newByteAttributes)
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

	if len(newAttributes) > 0 {
		updates.Set(attributesProp, newAttributes)
	}
	if len(newByteAttributes) > 0 {
		updates.Set(byteAttributesProp, newByteAttributes)
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
}