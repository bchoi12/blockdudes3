package main

var wasmIgnoreAttributes = map[AttributeType]bool {
	groundedAttribute: true,
	deadAttribute: true,
}

var wasmIgnoreByteAttributes = map[ByteAttributeType]bool {
	healthByteAttribute: true,
}

type Attribute struct {
	changed map[AttributeType]*State
	attributes map[AttributeType]bool

	byteChanged map[ByteAttributeType]*State
	byteAttributes map[ByteAttributeType]uint8
}

func NewAttribute() Attribute {
	return Attribute {
		changed: make(map[AttributeType]*State),
		attributes: make(map[AttributeType]bool),

		byteChanged: make(map[ByteAttributeType]*State),
		byteAttributes: make(map[ByteAttributeType]uint8),
	}
}

func (a *Attribute) AddAttribute(attribute AttributeType) {
	if has, ok := a.attributes[attribute]; ok && has {
		return
	}

	if _, ok := a.changed[attribute]; !ok {
		a.changed[attribute] = NewState(true)
	} else {
		a.changed[attribute].Set(true)
	}
	a.attributes[attribute] = true
}

func (a *Attribute) SetByteAttribute(attribute ByteAttributeType, byte uint8) {
	if value, ok := a.byteAttributes[attribute]; ok && value == byte {
		return
	}

	if _, ok := a.byteChanged[attribute]; !ok {
		a.byteChanged[attribute] = NewState(true)
	} else {
		a.byteChanged[attribute].Refresh()
	}
	a.byteAttributes[attribute] = byte
}

func (a *Attribute) RemoveAttribute(attribute AttributeType) {
	if has, ok := a.attributes[attribute]; ok && !has {
		return
	}

	if _, ok := a.changed[attribute]; !ok {
		a.changed[attribute] = NewState(false)
	} else {
		a.changed[attribute].Set(false)
	}
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
	for attribute, state := range(a.changed) {
		if isWasm && wasmIgnoreAttributes[attribute] {
			continue
		}

		if _, ok := state.Pop(); ok {
			newAttributes[attribute] = a.attributes[attribute]
		}
	}

	newByteAttributes := make(map[ByteAttributeType]uint8)
	for attribute, state := range(a.byteChanged) {
		if isWasm && wasmIgnoreByteAttributes[attribute] {
			continue
		}

		if _, ok := state.Pop(); ok {
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
	for attribute, state := range(a.changed) {
		if isWasm && wasmIgnoreAttributes[attribute] {
			continue
		}

		if _, ok := state.GetOnce(); ok {
			newAttributes[attribute] = a.attributes[attribute]
		}
	}

	newByteAttributes := make(map[ByteAttributeType]uint8)
	for attribute, state := range(a.byteChanged) {
		if isWasm && wasmIgnoreByteAttributes[attribute] {
			continue
		}

		if _, ok := state.GetOnce(); ok {
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
	// Note: ignored attributes are already filtered when doing parsing
	if data.Has(attributesProp) {
		a.attributes = data.Get(attributesProp).(map[AttributeType]bool)
	}

	if data.Has(byteAttributesProp) {
		a.byteAttributes = data.Get(byteAttributesProp).(map[ByteAttributeType]uint8)
	}
}