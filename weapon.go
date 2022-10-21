package main

type Weapon struct {
	*Equip
	shotOffset Vec2
}

func NewWeaponPart(weapon *Weapon, equipType EquipType) EquipPart {
	switch equipType {
	case uziWeapon:
		return NewLauncher(weapon, pelletSpace)
	case grapplingHookWeapon:
		return NewLauncher(weapon, grapplingHookSpace)
	case bazookaWeapon:
		return NewLauncher(weapon, rocketSpace)
	case sniperWeapon:
		return NewLauncher(weapon, boltSpace)
	case starWeapon:
		return NewLauncher(weapon, starSpace)
	case chargerEquip:
		return NewEquipCharger(weapon)
	}
	return nil
}

func NewWeapon(init Init) *Weapon {
	w := &Weapon {
		Equip: NewEquip(init),
		shotOffset: NewVec2(0, 0),
	}
	return w
}

func (w *Weapon) SetShotOffset(shotOffset Vec2) { w.shotOffset = shotOffset }
func (w Weapon) GetShotOrigin() Vec2 {
	origin := w.Pos()
	shotOffset := w.shotOffset
	shotOffset.Rotate(w.Dir().Angle())
	origin.Add(shotOffset, 1.0)
	return origin
}

func (w *Weapon) SetType(equipType EquipType, equipSubtype EquipType) {
	if isWasm {
		return
	}

	if currentType, ok := w.GetByteAttribute(typeByteAttribute); ok && currentType == uint8(equipType) {
		return
	}

	w.parts = make(map[KeyType]EquipPart)
	w.SetByteAttribute(typeByteAttribute, uint8(equipType))
	w.SetByteAttribute(subtypeByteAttribute, uint8(equipSubtype))

	main := NewWeaponPart(w, equipType)
	if main != nil {
		w.parts[mouseClick] = main
	}

	sub := NewWeaponPart(w, equipSubtype)
	if sub != nil {
		w.parts[altMouseClick] = sub
	}

	switch equipType {
	case bazookaWeapon:
		w.SetShotOffset(NewVec2(0.3, 0))
	case uziWeapon:
	case grapplingHookWeapon:
		w.SetShotOffset(NewVec2(0.5, 0))
	case sniperWeapon:
		w.SetShotOffset(NewVec2(0.6, 0))
	case starWeapon:
		w.SetShotOffset(NewVec2(0.1, 0))
	}
}