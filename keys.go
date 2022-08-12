package main

type Keys struct {
	enabled bool
	keys map[KeyType]bool
	lastKeys map[KeyType]bool
	lastKeyChange map[KeyType]SeqNumType
}

func NewKeys() Keys {
	return Keys {
		enabled: true,
		keys: make(map[KeyType]bool),
		lastKeys: make(map[KeyType]bool),
		lastKeyChange: make(map[KeyType]SeqNumType),
	}
}

func (k *Keys) SetEnabled(enabled bool) {
	k.enabled = enabled
}

func (k Keys) GetKeys() map[KeyType]bool {
	if !k.enabled {
		return make(map[KeyType]bool)
	}

	return k.keys
}

func (k Keys) KeyDown(key KeyType) bool {
	if !k.enabled {
		return false
	}

	val, ok := k.keys[key]
	return ok && val
}

func (k Keys) KeyPressed(key KeyType) bool {
	if !k.enabled {
		return false
	}

	val, ok := k.lastKeys[key]
	pressed := k.KeyDown(key) && (!ok || !val)
	return pressed
}

func (k *Keys) UpdateKeys(keyMsg KeyMsg) {
	seqNum := keyMsg.S

	// Press keys and convert keyMsg.K to a set
	keys := make(map[KeyType]bool)
	for _, key := range(keyMsg.K) {
		keys[key] = true
		k.maybeUpdateKey(key, true, seqNum)
	}

	// Release keys
	for key, _ := range(k.keys) {
		if pressed, ok := keys[key]; ok && pressed {
			continue
		}
		k.maybeUpdateKey(key, false, seqNum)
	}
}

func (k *Keys) SetKeys(keys map[KeyType]bool) {
	k.keys = keys
}

func (k *Keys) SaveKeys() {
	k.lastKeys = make(map[KeyType]bool)
	for key, pressed := range(k.keys) {
		k.lastKeys[key] = pressed
	}
}

func (k *Keys) maybeUpdateKey(key KeyType, update bool, seqNum SeqNumType) {
	pressed, hasKey := k.keys[key]
	lastUpdate, hasUpdate := k.lastKeyChange[key]

	if !hasKey || !hasUpdate {
		k.keys[key] = update
		k.lastKeyChange[key] = seqNum
		return
	}

	if pressed != update && lastUpdate < seqNum {
		k.keys[key] = update
		k.lastKeyChange[key] = seqNum
	}
}