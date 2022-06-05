package main

type Class struct {
	changed *State
	class map[ClassType]bool
}

func NewClass() Class {
	return Class {
		changed: NewBlankState(false),
		class: make(map[ClassType]bool),
	}
}

func (c *Class) AddClass(class ClassType) {
	c.changed.Set(true)
	c.class[class] = true
}

func (c *Class) RemoveClass(class ClassType) {
	c.changed.Set(true)
	c.class[class] = false
}

func (c Class) HasClass(class ClassType) bool {
	has, ok := c.class[class]
	return ok && has 
}

func (c Class) GetInitData() Data {
	data := NewData()

	if len(c.class) > 0 {
		data.Set(classProp, c.class)
	}
	return data
}

func (c Class) GetData() Data {
	return NewData()
}

func (c Class) GetUpdates() Data {
	updates := NewData()
	if _, ok := c.changed.GetOnce(); ok {
		updates.Set(classProp, c.class)
	}
	return updates
}

func (c *Class) SetData(data Data) {
	if data.Has(classProp) {
		c.class = data.Get(classProp).(map[ClassType]bool)
	}
}