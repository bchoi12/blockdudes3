package main

type Association struct {
	owner *State
}

func NewAssociation() Association {
	return Association {
		owner: NewBlankState(InvalidId()),
	}
}

func (a Association) GetOwner() SpacedId {
	return a.owner.Peek().(SpacedId)
}

func (a Association) HasOwner() bool {
	return a.owner.Has()
}

func (a *Association) SetOwner(owner SpacedId) {
	a.owner.Set(owner)
}

func (a Association) GetInitData() Data {
	data := NewData()
	if a.owner.Has() {
		data.Set(ownerProp, a.owner.Peek())
	}
	return data
}

func (a Association) GetData() Data {
	data := NewData()
	if owner, ok := a.owner.Pop(); ok {
		data.Set(ownerProp, owner)
	}
	return data
}

func (a Association) GetUpdates() Data {
	updates := NewData()
	if owner, ok := a.owner.GetOnce(); ok {
		updates.Set(ownerProp, owner)
	}
	return updates
}

func (a *Association) SetData(data Data) {
	if data.Has(ownerProp) {
		a.SetOwner(data.Get(ownerProp).(SpacedId))
	}
}