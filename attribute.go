package main

type Attribute struct {
	changed map[AttributeType]*State
	attributes map[AttributeType]bool
}

func NewAttribute() Attribute {
	return Attribute {
		changed: make(map[AttributeType]*State),
		attributes: make(map[AttributeType]bool),
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

func (a Attribute) GetInitData() Data {
	data := NewData()

	if len(a.attributes) > 0 {
		data.Set(attributesProp, a.attributes)
	}
	return data
}

func (a Attribute) GetData() Data {
	data := NewData()
	newAttributes := make(map[AttributeType]bool)
	for attribute, state := range(a.changed) {
		if _, ok := state.Pop(); ok {
			newAttributes[attribute] = a.attributes[attribute]
		}
	}
	data.Set(attributesProp, newAttributes)

	return data
}

func (a Attribute) GetUpdates() Data {
	updates := NewData()

	newAttributes := make(map[AttributeType]bool)
	for attribute, state := range(a.changed) {
		if _, ok := state.GetOnce(); ok {
			newAttributes[attribute] = a.attributes[attribute]
		}
	}
	updates.Set(attributesProp, newAttributes)
	return updates
}

func (a *Attribute) SetData(data Data) {
	if data.Has(attributesProp) {
		attributes := data.Get(attributesProp).(map[AttributeType]bool)

		for k, v := range(attributes) {
			a.attributes[k] = v
		}
	}
}