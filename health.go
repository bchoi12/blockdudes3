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
	health *State
	ticks []DamageTick
}

func NewHealth() Health {
	return Health {
		enabled: false,
		health: NewBlankState(0),
	}
}

func (h *Health) Respawn() {
	h.ticks = make([]DamageTick, 0)
}

func (h *Health) SetHealth(health int) {
	h.enabled = true
	h.health.Set(health)
}

func (h Health) GetHealth() int {
	return h.health.Peek().(int)
}

func (h Health) Dead() bool {
	if isWasm || !h.enabled {
		return false
	}
	return h.health.Peek().(int) <= 0
}

func (h Health) GetLastTicks(duration time.Duration) []DamageTick {
	currentTime := time.Now()
	for i, tick := range(h.ticks) {
		if currentTime.Sub(tick.time) <= duration {
			return h.ticks[i:]
		}
	}
	return make([]DamageTick, 0)
}

func (h Health) GetLastDamageId(duration time.Duration) SpacedId {
	tick := h.ticks[len(h.ticks)-1]

	if time.Now().Sub(tick.time) <= duration {
		return tick.sid
	}
	return InvalidId()
}

func (h *Health) TakeDamage(sid SpacedId, damage int) {
	if !h.enabled || h.Dead() || isWasm {
		return
	}
	h.health.Set(h.health.Peek().(int) - damage)

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

	if data.Has(healthProp) {
		h.health.Set(data.Get(healthProp).(int))
	}
}

func (h Health) GetData() Data {
	data := NewData()
	if !h.enabled {
		return data
	}
	if health, ok := h.health.Pop(); ok {
		data.Set(healthProp, health)
	}
	return data
}

func (h Health) GetUpdates() Data {
	updates := NewData()
	if !h.enabled {
		return updates
	}

	if health, ok := h.health.GetOnce(); ok {
		updates.Set(healthProp, health)
	}
	return updates
}