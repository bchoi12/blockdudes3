package main

import (
	"container/heap"
	"time"
)

type SpacedId struct {
	space int
	id int
}

func Id(space int, id int) SpacedId {
	return SpacedId {
		space: space,
		id: id,
	}
}

type Thing interface {
	GetProfile() Profile
	GetSpacedId() SpacedId

	UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool
}

type Init struct {
	Id int
	Pos Vec2
	Dim Vec2
}

type ThingItem struct {
	id int
	thing Thing

	priority float64
	index int
}

type ThingHeap []*ThingItem

func PopThing(things *ThingHeap) Thing {
	item := heap.Pop(things).(*ThingItem)
	return item.thing
}

func (th ThingHeap) Len() int { return len(th) }

func (th ThingHeap) Less(i, j int) bool {
	return th[i].priority > th[j].priority
}

func (th ThingHeap) Swap(i, j int) {
	th[i], th[j] = th[j], th[i]
	th[i].index = i
	th[j].index = j
}

func (th *ThingHeap) Push(x interface{}) {
	n := len(*th)
	item := x.(*ThingItem)
	item.index = n
	*th = append(*th, item)
}

func (th *ThingHeap) Pop() interface{} {
	old := *th
	n := len(old)
	item := old[n-1]
	old[n-1] = nil
	item.index = -1
	*th = old[0 : n-1]
	return item
}

func (th *ThingHeap) priority(item *ThingItem,  priority float64) {
	item.priority = priority
	heap.Fix(th, item.index)
}