package main

type Attribute struct {
	changed *State
	class map[AttributeType]bool
}

func NewAttribute() Attribute {
	return Attribute {
		changed: NewBlankState(false),
		class: make(map[AttributeType]bool),
	}
}

func (a *Attribute) AddAttribute(class AttributeType) {
	a.changed.Set(true)
	a.class[class] = true
}

func (a *Attribute) RemoveAttribute(class AttributeType) {
	a.changed.Set(true)
	a.class[class] = false
}

func (a Attribute) HasAttribute(class AttributeType) bool {
	has, ok := a.class[class]
	return ok && has 
}

func (a Attribute) GetInitData() Data {
	data := NewData()

	if len(a.class) > 0 {
		data.Set(attributeProp, a.class)
	}
	return data
}

func (a Attribute) GetData() Data {
	return NewData()
}

func (a Attribute) GetUpdates() Data {
	updates := NewData()
	if _, ok := a.changed.GetOnce(); ok {
		updates.Set(attributeProp, a.class)
	}
	return updates
}

func (a *Attribute) SetData(data Data) {
	if data.Has(attributeProp) {
		a.class = data.Get(attributeProp).(map[AttributeType]bool)
	}
}