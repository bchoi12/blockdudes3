package main

import (
	"math/rand"
)

type Chance struct {
	r *rand.Rand
	current int

	min int
	increment int
}

func NewGrowingChance(r *rand.Rand, min int, increment int) Chance {
	return Chance {
		r: r,
		current: min,
		min: min,
		increment: increment,
	}
}

func (c* Chance) Roll() bool {
	if c.r.Intn(100) < c.current {
		c.current = c.min
		return true
	} else {
		c.current += c.increment
		return false
	}
}