package main

type ColliderOptions struct {
	ids map[SpacedId]bool
	spaces map[SpaceType]bool
	attributes map[AttributeType]bool

	empty bool
}

func NewColliderOptions() ColliderOptions {
	return ColliderOptions {
		ids: make(map[SpacedId]bool),
		spaces: make(map[SpaceType]bool),
		attributes: make(map[AttributeType]bool),

		empty: true,
	}
}

func (co *ColliderOptions) SetIds(include bool, ids ...SpacedId) {
	co.empty = false
	for _, id := range(ids) {
		co.ids[id] = include
	}
}

func (co *ColliderOptions) SetSpaces(include bool, spaces ...SpaceType) {
	co.empty = false
	for _, space := range(spaces) {
		co.spaces[space] = include
	}
}

func (co *ColliderOptions) SetAttributes(include bool, attributes ...AttributeType) {
	co.empty = false
	for _, attribute := range(attributes) {
		co.attributes[attribute] = true
	}
}

func (co ColliderOptions) Evaluate(object Object) bool {
	if co.empty {
		return false
	}

	if val, ok := co.ids[object.GetSpacedId()]; ok {
		return val
	}

	if val, ok := co.spaces[object.GetSpace()]; ok {
		return val
	}

	for attribute, include := range(co.attributes) {
		if include && object.HasAttribute(attribute) {
			return true
		}
	}

/*
	for attribute, include := range(co.excludeAttributes) {
		if !exclude && !object.HasAttribute(attribute) {
			return false
		}
	}
*/

	return false
}