package main

type Connection struct {
	offset Vec2
}

func NewConnection(offset Vec2) Connection {
	return Connection {
		offset: offset,
	}
}

func (c Connection) GetOffset() Vec2 {
	return c.offset
}

type Attachment struct {
	children map[SpacedId]Connection
}

func NewAttachment() Attachment {
	return Attachment {
		children: make(map[SpacedId]Connection),
	}
}

func (a *Attachment) AddChild(sid SpacedId, connection Connection) {
	a.children[sid] = connection
}

func (a Attachment) HasChild(sid SpacedId) bool {
	_, ok := a.children[sid]
	return ok
}

func (a Attachment) GetChildren() map[SpacedId]Connection {
	return a.children
}