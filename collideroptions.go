package main

type ColliderOptions struct {
	ids map[SpacedId]bool
	spaces map[SpaceType]bool
	attributes map[AttributeType]bool
	byteAttributes map[ByteAttributeType]map[uint8]bool
}

func NewColliderOptions() ColliderOptions {
	return ColliderOptions {
		ids: make(map[SpacedId]bool),
		spaces: make(map[SpaceType]bool),
		attributes: make(map[AttributeType]bool),
		byteAttributes: make(map[ByteAttributeType]map[uint8]bool),
	}
}

// If object ID is specified, evaluate or exclude. Otherwise continue
func (co *ColliderOptions) SetIds(include bool, ids ...SpacedId) {
	for _, id := range(ids) {
		co.ids[id] = include
	}
}

// Skip evaluation if object space is not in the set of included spaces.
func (co *ColliderOptions) SetSpaces(spaces ...SpaceType) {
	for _, space := range(spaces) {
		co.spaces[space] = true
	}
}

// Skip evaluation if object has the specified attribute.
func (co *ColliderOptions) SetAttributes(attributes ...AttributeType) {
	for _, attribute := range(attributes) {
		co.attributes[attribute] = false
	}
}

func (co *ColliderOptions) ExcludeByteAttributes(byteAttribute ByteAttributeType, bytes ...uint8) {
	_, ok := co.byteAttributes[byteAttribute]
	if !ok {
		co.byteAttributes[byteAttribute] = make(map[uint8]bool)
	}
	for _, byte := range(bytes) {
		co.byteAttributes[byteAttribute][byte] = false
	}
}

func (co ColliderOptions) Evaluate(object Object) bool {
	if include, ok := co.ids[object.GetSpacedId()]; ok {
		return include
	}

	if include, ok := co.spaces[object.GetSpace()]; !ok || !include {
		return false
	}

	if len(co.attributes) == 0 {
		return true
	}

	for attribute, include := range(co.attributes) {
		if !include && object.HasAttribute(attribute) {
			return false
		}
	}

	for attribute, bytes := range(co.byteAttributes) {
		objAttribute, hasAttribute := object.GetByteAttribute(attribute)
		if !hasAttribute {
			continue
		}
		if val, ok := bytes[objAttribute]; ok && !val {
			return false
		}
	}
	return true
}