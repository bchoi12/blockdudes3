package main

var wasmIgnoreAttributes = map[AttributeType]bool {
	groundedAttribute: true,
}

type Attribute struct {
	changed map[AttributeType]bool
	attributes map[AttributeType]bool
}

func NewAttribute() Attribute {
	return Attribute {
		changed: make(map[AttributeType]bool),
		attributes: make(map[AttributeType]bool),
	}
}

func (a *Attribute) AddAttribute(attribute AttributeType) {
	if has, ok := a.attributes[attribute]; ok && has {
		return
	}

	a.changed[attribute] = true
	a.attributes[attribute] = true
}

func (a *Attribute) RemoveAttribute(attribute AttributeType) {
	if has, ok := a.attributes[attribute]; ok && !has {
		return
	}

	a.changed[attribute] = true
	a.attributes[attribute] = false
}

func (a Attribute) HasAttribute(attribute AttributeType) bool {
	has, ok := a.attributes[attribute]
	return ok && has 
}

func (a Attribute) GetInitData() Data {
	data := NewData()

	if len(a.attributes) > 0 {
		data.Set(attributesProp, a.attributes)
	}
	return data
}

func (a Attribute) GetData() Data {
	return NewData()
}

func (a Attribute) GetUpdates() Data {
	updates := NewData()

	if len(a.changed) > 0 {
		newAttributes := make(map[AttributeType]bool)
		for attribute, _ := range(a.changed) {
			newAttributes[attribute] = a.attributes[attribute]
		}
		updates.Set(attributesProp, newAttributes)

		a.changed = make(map[AttributeType]bool)
	}
	return updates
}

func (a *Attribute) SetData(data Data) {
	if data.Has(attributesProp) {
		attributes := data.Get(attributesProp).(map[AttributeType]bool)

		for k, v := range(attributes) {
			if isWasm && wasmIgnoreAttributes[k] {
				continue
			}
			a.attributes[k] = v
		}
	}
}