package main

import (
	"container/heap"
)

type ObjectItem struct {
	object Object

	priority float64
	index int
}

type ObjectHeap []*ObjectItem

func PopObject(oh *ObjectHeap) Object {
	item := heap.Pop(oh).(*ObjectItem)
	return item.object
}

func (oh ObjectHeap) Len() int { return len(oh) }

func (oh ObjectHeap) Less(i, j int) bool {
	return oh[i].priority > oh[j].priority
}

func (oh ObjectHeap) Swap(i, j int) {
	oh[i], oh[j] = oh[j], oh[i]
	oh[i].index = i
	oh[j].index = j
}

func (oh *ObjectHeap) Push(x interface{}) {
	n := len(*oh)
	item := x.(*ObjectItem)
	item.index = n
	*oh = append(*oh, item)
}

func (oh *ObjectHeap) Pop() interface{} {
	old := *oh
	n := len(old)
	item := old[n-1]
	old[n-1] = nil
	item.index = -1
	*oh = old[0 : n-1]
	return item
}

func (oh *ObjectHeap) priority(item *ObjectItem,  priority float64) {
	item.priority = priority
	heap.Fix(oh, item.index)
}
