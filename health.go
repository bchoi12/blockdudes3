package main

import (
	"time"
)

const (
	maxDamageTicks int = 10
)

type DamageTick struct {
	sid SpacedId
	damage int
	time time.Time
}

type DeathFunc func(thing Thing, grid *Grid)
type Health struct {
	enabled bool
	health int

	ticks []DamageTick
}

func NewHealth() Health {
	return Health {
		enabled: false,
		health: 0,
	}
}

func (h *Health) SetHealth(health int) {
	h.enabled = true
	h.health = health
}

func (h Health) GetHealth() int {
	return h.health
}

func (h Health) Dead() bool {
	return h.health <= 0
}

func (h Health) GetLastTicks(duration time.Duration) []DamageTick {
	currentTime := time.Now()
	for i, tick := range(h.ticks) {
		if currentTime.Sub(tick.time) < duration {
			return h.ticks[i:]
		}
	}
	return make([]DamageTick, 0)
}

func (h *Health) TakeDamage(sid SpacedId, damage int) {
	if !h.enabled || h.health <= 0 || isWasm {
		return
	}
	h.health -= damage

	tick := DamageTick {
		sid: sid,
		damage: damage,
		time: time.Now(),
	}
	h.ticks = append(h.ticks, tick)

	if len(h.ticks) > maxDamageTicks {
		h.ticks = h.ticks[1 : maxDamageTicks + 1]
	}
}

func (h *Health) SetData(data Data) {
	if !h.enabled || data.Size() == 0 {
		return
	}
	h.health = data.Get(healthProp).(int)
}

func (h Health) GetData() Data {
	data := NewData()
	if h.enabled {
		data.Set(healthProp, h.health)
	}
	return data
}