package main

type Association struct {
	owner SpacedId
	ownerFlag Flag
}

func NewAssociation() Association {
	return Association {
		owner: InvalidId(),
		ownerFlag: NewFlag(),
	}
}

func (a Association) GetOwner() SpacedId {
	return a.owner
}

func (a Association) HasOwner() bool {
	return a.ownerFlag.Has()
}

func (a *Association) SetOwner(owner SpacedId) {
	a.owner = owner
	a.ownerFlag.Set(true)
}

func (a Association) GetInitData() Data {
	data := NewData()
	if a.ownerFlag.Has() {
		data.Set(ownerProp, a.owner)
	}
	return data
}

func (a Association) GetData() Data {
	data := NewData()
	if val, ok:= a.ownerFlag.Pop(); ok && val {
		data.Set(ownerProp, a.owner)
	}
	return data
}

func (a Association) GetUpdates() Data {
	updates := NewData()
	if val, ok := a.ownerFlag.GetOnce(); ok && val {
		updates.Set(ownerProp, a.owner)
	}
	return updates
}

func (a *Association) SetData(data Data) {
	if data.Has(ownerProp) {
		a.SetOwner(data.Get(ownerProp).(SpacedId))
	}
}